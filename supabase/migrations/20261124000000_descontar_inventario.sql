-- =====================================================================
-- Panel de Camisetas: descontar del inventario al vender
-- Pegar completo en Supabase > SQL Editor > Run (después del primer archivo).
--
-- Cómo funciona:
--   * Cada pedido tiene "descontar" (sí/no).
--     - Sí  = la camiseta sale de tu stock en Quito -> se resta 1 del inventario.
--     - No  = es por encargo (todavía no la tienes) -> no toca el inventario.
--   * Si cancelas o borras un pedido que había descontado, la camiseta vuelve al inventario.
--   * Si editas un pedido y cambias modelo/equipo/talla, se devuelve la anterior
--     y se descuenta la nueva.
--   * Si no hay stock, el pedido NO se guarda y sale un aviso.
-- =====================================================================

alter table public.pedidos
  add column descontar boolean not null default false;

comment on column public.pedidos.descontar is
  'true = la camiseta salió del inventario (se restó 1). false = por encargo.';

-- Resta 1 del inventario. Falla si no hay stock.
create or replace function public.inventario_restar(p_modelo text, p_equipo text, p_talla text)
returns void language plpgsql as $$
begin
  update public.inventario
     set cantidad = cantidad - 1
   where modelo = p_modelo and equipo = p_equipo and talla = p_talla
     and cantidad >= 1;
  if not found then
    raise exception 'No hay stock de % - % talla % en el inventario', p_modelo, p_equipo, p_talla
      using errcode = 'P0001', hint = 'sin_stock';
  end if;
end;
$$;

-- Suma 1 al inventario (crea la fila si no existe).
create or replace function public.inventario_sumar(p_modelo text, p_equipo text, p_talla text)
returns void language plpgsql as $$
begin
  insert into public.inventario (modelo, equipo, talla, cantidad)
  values (p_modelo, p_equipo, p_talla, 1)
  on conflict (modelo, equipo, talla)
  do update set cantidad = public.inventario.cantidad + 1;
end;
$$;

create or replace function public.pedidos_mover_inventario()
returns trigger language plpgsql as $$
declare
  antes_ocupaba   boolean := false;
  ahora_ocupa     boolean := false;
begin
  if tg_op in ('UPDATE','DELETE') then
    antes_ocupaba := old.descontar and old.estado <> 'Cancelado';
  end if;
  if tg_op in ('INSERT','UPDATE') then
    ahora_ocupa := new.descontar and new.estado <> 'Cancelado';
  end if;

  -- Si nada relevante cambió, no tocar el inventario.
  if tg_op = 'UPDATE' and antes_ocupaba and ahora_ocupa
     and old.modelo = new.modelo and old.equipo = new.equipo and old.talla = new.talla then
    return new;
  end if;

  if antes_ocupaba then
    perform public.inventario_sumar(old.modelo, old.equipo, old.talla);
  end if;
  if ahora_ocupa then
    perform public.inventario_restar(new.modelo, new.equipo, new.talla);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger pedidos_inventario
  after insert or update or delete on public.pedidos
  for each row execute function public.pedidos_mover_inventario();

-- La vista del panel incluye la nueva columna.
drop view if exists public.pedidos_con_ganancia;
create view public.pedidos_con_ganancia
with (security_invoker = true) as
select
  p.id, p.fecha, p.cliente, p.modelo, p.equipo, p.talla, p.precio, p.anticipo,
  p.saldo, p.estado, p.notas, p.creado, p.descontar,
  c.costo_total                 as costo_unitario,
  p.precio - c.costo_total      as ganancia
from public.pedidos p
join public.costos_modelo c on c.modelo = p.modelo;
