-- Impuestito · esquema inicial
-- Cada trabajador ve y modifica solo sus propios datos (Row Level Security).

-- Perfil del trabajador: datos que van en el encabezado del PDF
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  trade text not null default '',
  business_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clientes guardados del trabajador
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  created_at timestamptz not null default now()
);
create index clients_user_id_idx on public.clients (user_id);

-- Presupuestos
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number integer not null,
  client_id uuid references public.clients (id) on delete set null,
  client_name text not null default '',
  client_phone text not null default '',
  description text not null default '',
  status text not null default 'borrador' check (status in ('borrador', 'enviado', 'aceptado')),
  validity_days integer not null default 15 check (validity_days between 1 and 365),
  total numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);
create index budgets_user_id_created_idx on public.budgets (user_id, created_at desc);
create index budgets_client_id_idx on public.budgets (client_id);

-- Ítems de cada presupuesto: materiales y mano de obra
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('material', 'mano_obra')),
  description text not null check (char_length(description) between 1 and 200),
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit text not null default 'u',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  position integer not null default 0
);
create index budget_items_budget_id_idx on public.budget_items (budget_id);
create index budget_items_user_id_idx on public.budget_items (user_id);

-- Numeración correlativa por trabajador (N.º 0001, 0002, ...)
create or replace function public.set_budget_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.number is null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select coalesce(max(b.number), 0) + 1 into new.number
    from public.budgets b
    where b.user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger budgets_set_number
before insert on public.budgets
for each row execute function public.set_budget_number();

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger budgets_touch before update on public.budgets
for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- Crear el perfil al registrarse, con los datos del formulario de registro
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, trade, business_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'trade', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Seguridad: cada usuario solo accede a sus filas
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;

create policy "perfil propio: leer" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfil propio: crear" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfil propio: editar" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "clientes propios" on public.clients
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "presupuestos propios" on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "items propios" on public.budget_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.budgets b
      where b.id = budget_id and b.user_id = (select auth.uid())
    )
  );

revoke execute on function public.set_budget_number() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Guardar un presupuesto completo (cabecera + ítems) en una sola transacción.
-- Corre con los permisos del usuario (security invoker), así que RLS sigue aplicando.
create or replace function public.save_budget(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_client uuid := nullif(p ->> 'client_id', '')::uuid;
  v_name text := trim(coalesce(p ->> 'client_name', ''));
  v_phone text := trim(coalesce(p ->> 'client_phone', ''));
  v_total numeric := 0;
  v_item jsonb;
  v_pos integer := 0;
begin
  if v_uid is null then
    raise exception 'Necesitás iniciar sesión';
  end if;

  -- Cliente: usar el elegido, o buscar/crear uno por nombre
  if v_client is null and v_name <> '' then
    select c.id into v_client
    from public.clients c
    where c.user_id = v_uid and lower(c.name) = lower(v_name)
    limit 1;
    if v_client is null then
      insert into public.clients (user_id, name, phone)
      values (v_uid, v_name, v_phone)
      returning id into v_client;
    end if;
  end if;
  if v_client is not null and v_phone <> '' then
    update public.clients set phone = v_phone where id = v_client and user_id = v_uid;
  end if;

  select coalesce(sum((x ->> 'quantity')::numeric * (x ->> 'unit_price')::numeric), 0)
  into v_total
  from jsonb_array_elements(coalesce(p -> 'items', '[]'::jsonb)) x;

  if v_id is null then
    insert into public.budgets (user_id, client_id, client_name, client_phone, description, status, validity_days, total)
    values (
      v_uid, v_client, v_name, v_phone,
      coalesce(p ->> 'description', ''),
      coalesce(nullif(p ->> 'status', ''), 'borrador'),
      coalesce((p ->> 'validity_days')::integer, 15),
      v_total
    )
    returning id into v_id;
  else
    update public.budgets set
      client_id = v_client,
      client_name = v_name,
      client_phone = v_phone,
      description = coalesce(p ->> 'description', ''),
      status = coalesce(nullif(p ->> 'status', ''), status),
      validity_days = coalesce((p ->> 'validity_days')::integer, validity_days),
      total = v_total
    where id = v_id and user_id = v_uid;
    if not found then
      raise exception 'No se encontró el presupuesto';
    end if;
    delete from public.budget_items where budget_id = v_id;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'items', '[]'::jsonb)) loop
    insert into public.budget_items (budget_id, user_id, kind, description, quantity, unit, unit_price, position)
    values (
      v_id, v_uid,
      v_item ->> 'kind',
      trim(v_item ->> 'description'),
      (v_item ->> 'quantity')::numeric,
      coalesce(nullif(v_item ->> 'unit', ''), 'u'),
      (v_item ->> 'unit_price')::numeric,
      v_pos
    );
    v_pos := v_pos + 1;
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.save_budget(jsonb) from public, anon;
grant execute on function public.save_budget(jsonb) to authenticated;
