-- =====================================================================
-- Panel de Camisetas: solo los correos de la lista pueden ver los datos
-- Pegar en Supabase > SQL Editor > Run (después de los archivos 1 y 2).
--
-- ANTES DE EJECUTAR: cambia TU-CORREO@ejemplo.com (al final) por el correo
-- con el que creaste tu usuario en Supabase.
--
-- Por qué: antes bastaba con tener cualquier cuenta. Ahora, aunque alguien
-- lograra crear una cuenta, la base de datos no le muestra nada si su correo
-- no está en esta lista.
-- =====================================================================

create table public.usuarios_permitidos (
  email  text primary key check (email = lower(email)),
  creado timestamptz not null default now()
);

comment on table public.usuarios_permitidos is
  'Correos que pueden usar la app. Para dar acceso a alguien, agrega su correo aquí.';

-- RLS activado y SIN políticas: nadie puede leer ni cambiar esta lista desde la app.
-- Solo se edita desde el panel de Supabase (Table Editor o SQL Editor).
alter table public.usuarios_permitidos enable row level security;

-- ¿El usuario que hizo la petición está en la lista?
create or replace function public.es_permitido()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios_permitidos
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.es_permitido() from public, anon;
grant execute on function public.es_permitido() to authenticated;

-- Reemplazar las reglas anteriores ("cualquier usuario con sesión")
-- por "solo usuarios con sesión Y en la lista".
drop policy "Usuarios con sesión: acceso total" on public.costos_modelo;
drop policy "Usuarios con sesión: acceso total" on public.pedidos;
drop policy "Usuarios con sesión: acceso total" on public.gastos;
drop policy "Usuarios con sesión: acceso total" on public.inventario;

create policy "Solo usuarios permitidos" on public.costos_modelo
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.pedidos
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.gastos
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.inventario
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());

-- 👇 CAMBIA ESTE CORREO POR EL TUYO 👇
insert into public.usuarios_permitidos (email) values (lower('TU-CORREO@ejemplo.com'));
