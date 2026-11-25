-- =====================================================================
-- Panel de Camisetas: PASO 4 — declaraciones del SRI y comprobantes
-- Pegar en Supabase > SQL Editor > Run. Ejecutar UNA sola vez
-- (después del archivo de lotes). No borra nada.
-- =====================================================================

-- Declaraciones ya presentadas (las fechas de cada una las calcula la app).
create table public.declaraciones (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('IVA', 'Renta')),
  periodo        text not null check (periodo ~ '^\d{4}(-S[12])?$'),   -- '2026-S2' (IVA) o '2026' (Renta)
  presentada_el  date not null default current_date,
  valor_pagado   numeric(10,2) not null default 0 check (valor_pagado >= 0),
  notas          text,
  creado         timestamptz not null default now(),
  unique (tipo, periodo)
);

comment on table public.declaraciones is 'Declaraciones del SRI que Mario ya presentó.';

alter table public.declaraciones enable row level security;
create policy "Solo usuarios permitidos" on public.declaraciones
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());

-- Comprobantes: fotos o PDF de declaraciones y facturas.
create table public.comprobantes (
  id              uuid primary key default gen_random_uuid(),
  fecha           date not null default current_date,
  tipo            text not null check (tipo in ('Declaración', 'Factura de compra', 'Factura de venta', 'Otro')),
  descripcion     text not null check (length(trim(descripcion)) > 0),
  archivo         text not null unique,   -- ruta dentro del espacio "comprobantes"
  nombre_archivo  text,
  creado          timestamptz not null default now()
);
create index comprobantes_fecha_idx on public.comprobantes (fecha desc);

alter table public.comprobantes enable row level security;
create policy "Solo usuarios permitidos" on public.comprobantes
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());

-- Espacio PRIVADO para guardar los archivos (máximo 10 MB por archivo).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do nothing;

create policy "Comprobantes: solo usuarios permitidos" on storage.objects
  for all to authenticated
  using (bucket_id = 'comprobantes' and public.es_permitido())
  with check (bucket_id = 'comprobantes' and public.es_permitido());

notify pgrst, 'reload schema';
