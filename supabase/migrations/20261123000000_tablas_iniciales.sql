-- =====================================================================
-- Panel de Camisetas: tablas iniciales
-- Pegar completo en Supabase > SQL Editor > Run.
-- Todos los montos están en dólares (USD).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COSTOS POR MODELO
-- Un registro por cada tipo de camiseta. Aquí anotas cuánto te cuesta
-- cada una puesta en Quito y a cuánto la vendes normalmente.
-- ---------------------------------------------------------------------
create table public.costos_modelo (
  modelo            text primary key,
  costo_proveedor   numeric(10,2) not null default 0 check (costo_proveedor >= 0), -- lo que cobra China por unidad
  envio_miami       numeric(10,2) not null default 0 check (envio_miami >= 0),     -- envío China -> casillero Miami, por unidad
  flete_geomil      numeric(10,2) not null default 0 check (flete_geomil >= 0),    -- Geomil Miami -> Quito, por unidad
  impuestos         numeric(10,2) not null default 0 check (impuestos >= 0),       -- aduana / aranceles, por unidad
  costo_total       numeric(10,2) generated always as
                      (costo_proveedor + envio_miami + flete_geomil + impuestos) stored,
  precio_venta      numeric(10,2) not null default 0 check (precio_venta >= 0),    -- precio de venta sugerido
  actualizado       timestamptz not null default now()
);

comment on table public.costos_modelo is 'Costo real por unidad de cada modelo de camiseta, puesta en Quito.';

insert into public.costos_modelo (modelo) values
  ('Fan manga corta'),
  ('Fan manga larga'),
  ('Jugador Adidas'),
  ('Jugador Nike/Puma'),
  ('Retro');

-- ---------------------------------------------------------------------
-- 2. PEDIDOS (ventas a clientes)
-- ---------------------------------------------------------------------
create table public.pedidos (
  id        bigint generated always as identity primary key,
  fecha     date not null default current_date,
  cliente   text not null check (length(trim(cliente)) > 0),
  modelo    text not null references public.costos_modelo(modelo) on update cascade,
  equipo    text not null check (length(trim(equipo)) > 0),
  talla     text not null check (talla in ('XS','S','M','L','XL','XXL','XXXL')),
  precio    numeric(10,2) not null check (precio >= 0),
  anticipo  numeric(10,2) not null default 0 check (anticipo >= 0),
  saldo     numeric(10,2) generated always as (precio - anticipo) stored,  -- lo que falta cobrar
  estado    text not null default 'Por encargo'
              check (estado in ('Por encargo','Pagado','Entregado','Cancelado')),
  notas     text,
  creado    timestamptz not null default now(),
  constraint anticipo_no_mayor_al_precio check (anticipo <= precio)
);

comment on table public.pedidos is 'Pedidos de clientes. saldo = precio - anticipo.';
create index pedidos_fecha_idx on public.pedidos (fecha);
create index pedidos_estado_idx on public.pedidos (estado);

-- ---------------------------------------------------------------------
-- 3. GASTOS
-- ---------------------------------------------------------------------
create table public.gastos (
  id         bigint generated always as identity primary key,
  fecha      date not null default current_date,
  concepto   text not null check (length(trim(concepto)) > 0),
  categoria  text not null check (categoria in (
               'Compra a proveedor',
               'Envío China-Miami',
               'Casillero Miami',
               'Geomil',
               'Impuestos / aduana',
               'Publicidad',
               'Empaques',
               'Envío local',
               'Comisiones de pago',
               'Otros')),
  monto      numeric(10,2) not null check (monto > 0),
  creado     timestamptz not null default now()
);

comment on table public.gastos is 'Todos los gastos del negocio.';
create index gastos_fecha_idx on public.gastos (fecha);

-- ---------------------------------------------------------------------
-- 4. INVENTARIO (camisetas disponibles en Quito)
-- Una fila por combinación modelo + equipo + talla.
-- ---------------------------------------------------------------------
create table public.inventario (
  id          bigint generated always as identity primary key,
  modelo      text not null references public.costos_modelo(modelo) on update cascade,
  equipo      text not null check (length(trim(equipo)) > 0),
  talla       text not null check (talla in ('XS','S','M','L','XL','XXL','XXXL')),
  cantidad    integer not null default 0 check (cantidad >= 0),
  actualizado timestamptz not null default now(),
  constraint inventario_unico unique (modelo, equipo, talla)
);

comment on table public.inventario is 'Stock disponible por modelo, equipo y talla.';

-- ---------------------------------------------------------------------
-- 5. Mantener la fecha "actualizado" al día automáticamente
-- ---------------------------------------------------------------------
create or replace function public.marcar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado := now();
  return new;
end;
$$;

create trigger costos_modelo_actualizado before update on public.costos_modelo
  for each row execute function public.marcar_actualizado();
create trigger inventario_actualizado before update on public.inventario
  for each row execute function public.marcar_actualizado();

-- ---------------------------------------------------------------------
-- 6. VISTA: ganancia por pedido (para el panel)
-- ---------------------------------------------------------------------
create view public.pedidos_con_ganancia
with (security_invoker = true) as
select
  p.*,
  c.costo_total                 as costo_unitario,
  p.precio - c.costo_total      as ganancia
from public.pedidos p
join public.costos_modelo c on c.modelo = p.modelo;

-- ---------------------------------------------------------------------
-- 7. SEGURIDAD (Row Level Security)
-- Solo usuarios que iniciaron sesión pueden ver y editar los datos.
-- Nadie anónimo puede leer nada.
-- ---------------------------------------------------------------------
alter table public.costos_modelo enable row level security;
alter table public.pedidos       enable row level security;
alter table public.gastos        enable row level security;
alter table public.inventario    enable row level security;

create policy "Usuarios con sesión: acceso total" on public.costos_modelo
  for all to authenticated using (true) with check (true);
create policy "Usuarios con sesión: acceso total" on public.pedidos
  for all to authenticated using (true) with check (true);
create policy "Usuarios con sesión: acceso total" on public.gastos
  for all to authenticated using (true) with check (true);
create policy "Usuarios con sesión: acceso total" on public.inventario
  for all to authenticated using (true) with check (true);
