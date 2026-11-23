-- =====================================================================
-- Panel de Camisetas: DISEÑO NUEVO (según el CLAUDE.md de Mario)
-- Pegar en Supabase > SQL Editor > Run. Ejecutar UNA sola vez.
--
-- ⚠️ BORRA las tablas de prueba anteriores (pedidos, gastos, inventario,
--    costos_modelo) y las crea de nuevo. Mario confirmó que no tenían datos.
--    NO toca tu usuario ni la tabla usuarios_permitidos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Quitar lo anterior
-- ---------------------------------------------------------------------
drop view if exists public.pedidos_con_ganancia;
drop table if exists public.pedidos cascade;
drop table if exists public.gastos cascade;
drop table if exists public.inventario cascade;
drop table if exists public.costos_modelo cascade;
drop function if exists public.pedidos_mover_inventario() cascade;
drop function if exists public.inventario_restar(text, text, text);
drop function if exists public.inventario_sumar(text, text, text);

-- ---------------------------------------------------------------------
-- 1. MODELOS
-- costo_estimado: costo aproximado puesto en Quito, se usa en las preventas
-- mientras no haya un lote con el costo real.
-- ---------------------------------------------------------------------
create table public.modelos (
  id                     uuid primary key default gen_random_uuid(),
  nombre                 text not null unique check (length(trim(nombre)) > 0),
  orden                  int  not null default 0,
  precio_proveedor       numeric(10,2) not null default 0 check (precio_proveedor >= 0),
  peso_lb                numeric(5,2)  not null default 0 check (peso_lb >= 0),
  costo_estimado         numeric(10,2) not null default 0 check (costo_estimado >= 0),
  precio_venta_sugerido  numeric(10,2) not null default 0 check (precio_venta_sugerido >= 0)
);

comment on column public.modelos.costo_estimado is
  'Costo aproximado por camiseta en Quito (proveedor + envíos + Geomil). Se usa para preventas.';

insert into public.modelos (orden, nombre, precio_proveedor, peso_lb, costo_estimado, precio_venta_sugerido) values
  (1, 'Fan manga corta',                    12, 0.6, 18.90, 32),
  (2, 'Fan manga larga',                    14, 0.7, 21.70, 35),
  (3, 'Jugador Adidas',                     15, 0.5, 20.90, 39),
  (4, 'Jugador Nike / Puma / Jordan / NB',  17, 0.5, 22.90, 41),
  (5, 'Retro',                              16, 0.6, 22.80, 36);

-- ---------------------------------------------------------------------
-- 2. LOTES (cada importación) — la pantalla para usarlos llega en el paso 2
-- ---------------------------------------------------------------------
create table public.lotes (
  id                 uuid primary key default gen_random_uuid(),
  fecha_pedido       date not null default current_date,
  fecha_llegada      date,
  proveedor          text not null default 'SoccerPlus' check (proveedor in ('SoccerPlus','GMKits')),
  metodo_envio       text not null default 'UPS/FedEx'  check (metodo_envio in ('USPS','UPS/FedEx','SZ-FedEx')),
  costo_proveedor    numeric(10,2) not null default 0 check (costo_proveedor >= 0),
  costo_envio_miami  numeric(10,2) not null default 0 check (costo_envio_miami >= 0),
  peso_lb            numeric(6,2),
  costo_geomil       numeric(10,2),
  guia               text,
  estado             text not null default 'Pedido' check (estado in ('Pedido','En Miami','En Quito','Recibido')),
  notas              text,
  creado             timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. CLIENTES
-- ---------------------------------------------------------------------
create table public.clientes (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null check (length(trim(nombre)) > 0),
  instagram        text,
  whatsapp         text,
  ciudad           text,
  equipo_favorito  text,
  creado           timestamptz not null default now()
);
create unique index clientes_nombre_unico on public.clientes (lower(nombre));

-- ---------------------------------------------------------------------
-- 4. INVENTARIO
-- ---------------------------------------------------------------------
create table public.inventario (
  id              uuid primary key default gen_random_uuid(),
  modelo_id       uuid not null references public.modelos(id),
  equipo          text not null check (length(trim(equipo)) > 0),
  talla           text not null check (talla in ('S','M','L','XL','2XL','3XL','Niño')),
  cantidad        int  not null default 0 check (cantidad >= 0),
  costo_unitario  numeric(10,2) not null default 0 check (costo_unitario >= 0),
  lote_id         uuid references public.lotes(id) on delete set null,
  actualizado     timestamptz not null default now(),
  constraint inventario_unico unique nulls not distinct (modelo_id, equipo, talla, lote_id)
);

-- ---------------------------------------------------------------------
-- 5. PEDIDOS
-- ---------------------------------------------------------------------
create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  fecha            date not null default current_date,
  cliente_id       uuid not null references public.clientes(id),
  modelo_id        uuid not null references public.modelos(id),
  equipo           text not null check (length(trim(equipo)) > 0),
  talla            text not null check (talla in ('S','M','L','XL','2XL','3XL','Niño')),
  personalizacion  text,
  precio_venta     numeric(10,2) not null check (precio_venta >= 0),          -- IVA incluido
  anticipo         numeric(10,2) not null default 0 check (anticipo >= 0),
  saldo            numeric(10,2) generated always as (precio_venta - anticipo) stored,
  estado           text not null default 'Preventa'
                     check (estado in ('Preventa','Pagado','Entregado','Cancelado')),
  entrega          text not null default 'Quito en mano'
                     check (entrega in ('Quito en mano','USFQ','Servientrega')),
  costo            numeric(10,2) not null default 0 check (costo >= 0),       -- lo pone la base de datos
  inventario_id    uuid references public.inventario(id) on delete set null,  -- null = preventa
  notas            text,
  creado           timestamptz not null default now(),
  constraint anticipo_no_mayor_al_precio check (anticipo <= precio_venta)
);
create index pedidos_fecha_idx on public.pedidos (fecha);

-- ---------------------------------------------------------------------
-- 6. GASTOS
-- ---------------------------------------------------------------------
create table public.gastos (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null default current_date,
  concepto   text not null check (length(trim(concepto)) > 0),
  categoria  text not null check (categoria in (
               'Compra a proveedor','Envío a Miami','Geomil',
               'Envío local','Publicidad','Empaques','Impuestos','Otros')),
  monto      numeric(10,2) not null check (monto > 0),
  tipo       text generated always as (
               case when categoria in ('Compra a proveedor','Envío a Miami','Geomil')
                    then 'Mercadería' else 'Operativo' end) stored,
  lote_id    uuid references public.lotes(id) on delete set null,
  creado     timestamptz not null default now()
);
create index gastos_fecha_idx on public.gastos (fecha);

-- ---------------------------------------------------------------------
-- 7. REGLAS AUTOMÁTICAS DE LOS PEDIDOS
-- a) Si la camiseta sale del stock, copia modelo/equipo/talla del inventario.
-- b) Guarda el costo al momento de la venta: el del inventario (stock) o el
--    costo estimado del modelo (preventa). No cambia si luego cambian precios.
-- c) Resta 1 del inventario; si se cancela o borra, lo devuelve.
-- ---------------------------------------------------------------------
create or replace function public.pedidos_preparar()
returns trigger language plpgsql as $$
declare
  inv public.inventario;
begin
  if new.inventario_id is not null then
    select * into inv from public.inventario where id = new.inventario_id;
    if not found then
      raise exception 'Esa camiseta ya no existe en el inventario' using hint = 'sin_stock';
    end if;
    new.modelo_id := inv.modelo_id;
    new.equipo    := inv.equipo;
    new.talla     := inv.talla;
  end if;

  if tg_op = 'INSERT'
     or new.inventario_id is distinct from old.inventario_id
     or new.modelo_id     is distinct from old.modelo_id then
    if new.inventario_id is not null then
      new.costo := inv.costo_unitario;
    else
      select costo_estimado into new.costo from public.modelos where id = new.modelo_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger pedidos_preparar
  before insert or update on public.pedidos
  for each row execute function public.pedidos_preparar();

create or replace function public.pedidos_mover_inventario()
returns trigger language plpgsql as $$
declare
  antes  uuid := null;
  ahora  uuid := null;
begin
  if tg_op in ('UPDATE','DELETE') and old.estado <> 'Cancelado' then antes := old.inventario_id; end if;
  if tg_op in ('INSERT','UPDATE') and new.estado <> 'Cancelado' then ahora := new.inventario_id; end if;

  if antes is not distinct from ahora then
    return coalesce(new, old);
  end if;

  if antes is not null then
    update public.inventario set cantidad = cantidad + 1 where id = antes;
  end if;
  if ahora is not null then
    update public.inventario set cantidad = cantidad - 1 where id = ahora and cantidad >= 1;
    if not found then
      raise exception 'No queda stock de esa camiseta' using hint = 'sin_stock';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger pedidos_inventario
  after insert or update or delete on public.pedidos
  for each row execute function public.pedidos_mover_inventario();

-- Fecha de "actualizado" del inventario
create or replace function public.marcar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado := now();
  return new;
end;
$$;
create trigger inventario_actualizado before update on public.inventario
  for each row execute function public.marcar_actualizado();

-- ---------------------------------------------------------------------
-- 8. VISTAS (para listas y panel)
-- ingreso_neto = precio sin IVA (÷ 1,15); ganancia = ingreso_neto − costo
-- ---------------------------------------------------------------------
create view public.pedidos_detalle
with (security_invoker = true) as
select
  p.*,
  c.nombre                                as cliente,
  c.whatsapp                              as cliente_whatsapp,
  c.instagram                             as cliente_instagram,
  c.ciudad                                as cliente_ciudad,
  m.nombre                                as modelo,
  round(p.precio_venta / 1.15, 2)         as ingreso_neto,
  round(p.precio_venta / 1.15, 2) - p.costo as ganancia
from public.pedidos p
join public.clientes c on c.id = p.cliente_id
join public.modelos  m on m.id = p.modelo_id;

create view public.inventario_detalle
with (security_invoker = true) as
select i.*, m.nombre as modelo, m.orden as modelo_orden
from public.inventario i
join public.modelos m on m.id = i.modelo_id;

-- ---------------------------------------------------------------------
-- 9. SEGURIDAD: solo correos de usuarios_permitidos
-- ---------------------------------------------------------------------
alter table public.modelos    enable row level security;
alter table public.lotes      enable row level security;
alter table public.clientes   enable row level security;
alter table public.inventario enable row level security;
alter table public.pedidos    enable row level security;
alter table public.gastos     enable row level security;

create policy "Solo usuarios permitidos" on public.modelos
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.lotes
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.clientes
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.inventario
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.pedidos
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
create policy "Solo usuarios permitidos" on public.gastos
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());
