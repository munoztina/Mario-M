-- =====================================================================
-- Panel de Camisetas: PASO 2 — camisetas de cada lote y "Recibir en Quito"
-- Pegar en Supabase > SQL Editor > Run. Ejecutar UNA sola vez
-- (después del archivo del paso 1). No borra nada.
-- =====================================================================

-- Datos extra del lote
alter table public.lotes
  add column descuento          numeric(5,2) not null default 0 check (descuento >= 0 and descuento <= 100),
  add column entrega_domicilio  boolean not null default false;

comment on column public.lotes.descuento is 'Descuento del proveedor en % (2–5% desde 5 unidades).';

-- Camisetas de cada lote
create table public.lote_items (
  id               uuid primary key default gen_random_uuid(),
  lote_id          uuid not null references public.lotes(id) on delete cascade,
  modelo_id        uuid not null references public.modelos(id),
  equipo           text not null check (length(trim(equipo)) > 0),
  talla            text not null check (talla in ('S','M','L','XL','2XL','3XL','Niño')),
  cantidad         int  not null check (cantidad > 0),
  precio_unitario  numeric(10,2) not null default 0 check (precio_unitario >= 0),  -- precio del proveedor por unidad
  extras           numeric(10,2) not null default 0 check (extras >= 0),           -- nombre y número, parches…
  costo_unitario   numeric(10,2) not null default 0 check (costo_unitario >= 0),   -- calculado: puesta en Quito
  inventario_id    uuid references public.inventario(id) on delete set null        -- se llena al recibir
);
create index lote_items_lote_idx on public.lote_items (lote_id);

alter table public.lote_items enable row level security;
create policy "Solo usuarios permitidos" on public.lote_items
  for all to authenticated using (public.es_permitido()) with check (public.es_permitido());

-- Resumen de cada lote (para listas y panel)
create view public.lotes_resumen
with (security_invoker = true) as
select l.*,
       coalesce(sum(i.cantidad), 0)::int as unidades
from public.lotes l
left join public.lote_items i on i.lote_id = l.id
group by l.id;

-- ---------------------------------------------------------------------
-- Recibir un lote en Quito (todo o nada):
-- 1. Pasa cada camiseta del lote al inventario con su costo real.
-- 2. Asigna las preventas elegidas a esas camisetas (resta del stock y
--    el pedido toma el costo real).
-- 3. Marca el lote como "Recibido".
-- Devuelve cuántas preventas se asignaron.
-- ---------------------------------------------------------------------
create or replace function public.recibir_lote(p_lote uuid, p_fecha date, p_pedidos uuid[])
returns int
language plpgsql
as $$
declare
  it        public.lote_items;
  v_inv     uuid;
  v_pedido  public.pedidos;
  asignados int := 0;
begin
  if not exists (select 1 from public.lotes where id = p_lote and estado <> 'Recibido') then
    raise exception 'Este lote ya fue recibido' using hint = 'lote_recibido';
  end if;

  for it in select * from public.lote_items where lote_id = p_lote and inventario_id is null loop
    insert into public.inventario (modelo_id, equipo, talla, cantidad, costo_unitario, lote_id)
    values (it.modelo_id, it.equipo, it.talla, it.cantidad, it.costo_unitario, p_lote)
    on conflict on constraint inventario_unico
      do update set cantidad = public.inventario.cantidad + excluded.cantidad
    returning id into v_inv;
    update public.lote_items set inventario_id = v_inv where id = it.id;
  end loop;

  for v_pedido in
    select * from public.pedidos
    where id = any(coalesce(p_pedidos, '{}')) and inventario_id is null and estado <> 'Cancelado'
    order by fecha
  loop
    v_inv := null;
    select inv.id into v_inv
    from public.lote_items li
    join public.inventario inv on inv.id = li.inventario_id
    where li.lote_id = p_lote
      and li.modelo_id = v_pedido.modelo_id
      and lower(li.equipo) = lower(v_pedido.equipo)
      and li.talla = v_pedido.talla
      and inv.cantidad > 0
    limit 1;
    if v_inv is not null then
      update public.pedidos set inventario_id = v_inv where id = v_pedido.id;
      asignados := asignados + 1;
    end if;
  end loop;

  update public.lotes
     set estado = 'Recibido', fecha_llegada = coalesce(fecha_llegada, p_fecha)
   where id = p_lote;

  return asignados;
end;
$$;

revoke execute on function public.recibir_lote(uuid, date, uuid[]) from public, anon;
grant execute on function public.recibir_lote(uuid, date, uuid[]) to authenticated;
