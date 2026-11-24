-- Logo del negocio (imagen chica en data URL) para el encabezado del PDF
alter table public.profiles add column if not exists logo text not null default '' check (char_length(logo) < 200000);
