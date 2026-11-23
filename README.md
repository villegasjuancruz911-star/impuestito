# Impuestito

App web instalable (PWA) para que trabajadores independientes de Villa Regina armen, guarden y compartan presupuestos claros desde el celular: cargan materiales, cantidades, precios y mano de obra, el total se calcula solo y el PDF se comparte por WhatsApp.

Proyecto de la materia Diseño UX/UI (carrera Desarrollo de Software Full Stack), por Luca Silva y Juan Cruz Villegas.

## Funciones

- Onboarding, registro en 2 pasos (datos y oficio), ingreso con email o Google, recuperación de contraseña.
- Home con resumen del mes y presupuestos recientes.
- Armado del presupuesto en 3 pasos: cliente y trabajo, ítems con total en vivo, revisión con vista previa.
- PDF generado en el celular, compartible por WhatsApp, email o descarga.
- Mis presupuestos con búsqueda, filtros por estado y orden.
- Detalle con cambio de estado (Borrador, Enviado, Aceptado), edición con total recalculado, duplicado y borrado.
- Perfil con los datos que van en el encabezado del PDF, y listado de clientes guardados.
- Instalable en el celular y funciona sin conexión para abrir la app.

## Tecnologías

- React + Vite
- Supabase (autenticación y Postgres con Row Level Security)
- pdf-lib para generar el PDF en el dispositivo

## Cómo correrla

```bash
npm install
cp .env.example .env   # completar con los datos de Supabase
npm run dev
```

Sin datos de Supabase en `.env`, la app arranca en **modo demo**: todo se guarda en el navegador y en Perfil aparece un botón para cargar presupuestos de ejemplo.

## Base de datos

El esquema está en `supabase/migrations/0001_init.sql`: tablas `profiles`, `clients`, `budgets` y `budget_items`, numeración correlativa por trabajador, la función `save_budget` (guarda cabecera e ítems en una sola transacción) y políticas para que cada usuario vea solo sus datos.

En el panel de Supabase, en Authentication → URL Configuration, cargar la URL publicada de la app como **Site URL** y en **Redirect URLs**, para que funcionen la confirmación de email y la recuperación de contraseña. Para el botón de Google, habilitar el proveedor en Authentication → Providers.

## Publicación

Es un sitio estático: `npm run build` genera la carpeta `dist`. Se puede publicar en Render, Netlify, Vercel o GitHub Pages cargando las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
