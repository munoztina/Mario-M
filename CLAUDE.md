# CLAUDE.md: Panel de Camisetas

Este archivo da contexto a Claude (y a cualquier desarrollador) sobre el negocio y el proyecto.
Léelo antes de hacer cambios.

## Sobre el dueño

- Se llama Mario. Estudia odontología y lleva este negocio en paralelo.
- **No es programador.** Explícale todo en español, en pasos simples, sin jerga.
  Si un término técnico es inevitable, defínelo en una frase.
- Antes de cambios grandes (borrar datos, cambiar la base de datos, publicar), explica qué vas a hacer y pide confirmación.

## El negocio

Venta de camisetas de fútbol en **Ecuador** (base en **Quito**). Moneda: **dólares (USD)**, que es la moneda oficial de Ecuador.

### Productos (categorías)

| Categoría | Variante | Notas |
|---|---|---|
| Fan | Manga corta | Versión aficionado, la más vendida |
| Fan | Manga larga | |
| Jugador | Adidas | Versión "player", tela y corte de jugador |
| Jugador | Nike / Puma | Se agrupan juntas |
| Retro | — | Camisetas de temporadas pasadas |

Cada camiseta además tiene: **equipo/selección**, **temporada** (ej. 2025/26), **local/visitante/alterna**, **talla** (S, M, L, XL, XXL…) y opcionalmente **personalización** (nombre y número, parches).

### Cadena de suministro

```
Proveedor en China ──► Casillero en Miami ──► Geomil (courier) ──► Casa de Mario en Quito ──► Cliente
```

1. Mario compra al **proveedor en China** (pago del producto + envío China→Miami).
2. El paquete llega a su **casillero en Miami**.
3. **Geomil** (empresa courier) lo trae de Miami a **Quito**. Cobra por peso y puede haber impuestos/aranceles de aduana de Ecuador.
4. Mario vende y entrega a clientes en Ecuador (en persona o envío local).

### Costos que importan

El **costo real** de cada camiseta no es solo lo que cobra el proveedor. Hay que sumar:

- Precio del proveedor (por unidad)
- Envío China → Miami
- Tarifa del casillero (si aplica)
- Flete Geomil Miami → Quito (por peso)
- Impuestos / aranceles de aduana
- Comisiones de pago (transferencia, PayPal, tarjeta, etc.)

Los costos de envío e impuestos se pagan **por paquete (lote)**, así que hay que **repartirlos entre las camisetas del lote** para saber el costo real por unidad. Por defecto se reparten en partes iguales por unidad; más adelante se puede repartir por peso.

Gastos generales que no son de un lote: publicidad (Instagram/Facebook/TikTok), empaques, envíos locales a clientes, fotos, etc.

## Qué debe hacer la app

1. **Pedidos de clientes (ventas):** quién compró, qué camiseta, talla, personalización, precio, abono/anticipo, estado y forma de pago.
   Muchas ventas son **por encargo**: el cliente paga un anticipo antes de que la camiseta llegue de China.
2. **Compras / lotes de importación:** qué se pidió al proveedor, cuánto costó y en qué etapa está el envío.
3. **Gastos:** registrar cualquier gasto con fecha, categoría, monto y nota.
4. **Inventario:** camisetas disponibles en Quito, en camino y ya reservadas para un cliente.
5. **Panel (dashboard):** ventas, ganancia, gastos y margen del mes; camisetas más vendidas; dinero por cobrar; lotes en camino.

### Estados

- **Lote de importación:** Pedido al proveedor → Enviado desde China → En casillero Miami → En tránsito (Geomil) → Recibido en Quito
- **Pedido de cliente:** Por encargo (anticipo) → Pagado → Entregado · (o Cancelado)

## Tecnología

- **Next.js** (App Router, TypeScript): la aplicación web.
- **Supabase**: base de datos (PostgreSQL) e inicio de sesión. Solo Mario (y quien él autorice) puede entrar.
- **Vercel**: donde se publica la app en internet.
- **Tailwind CSS** para el diseño. Debe verse bien en **celular**, porque Mario la usará sobre todo desde el teléfono.

### Convenciones

- Toda la interfaz en **español** (Ecuador). Fechas `dd/mm/aaaa`, dinero `$1.234,56` o `$1,234.56` (decidir una y mantenerla).
- Guardar montos de dinero como números decimales exactos (`numeric(10,2)`), nunca como texto.
- Las claves secretas (Supabase, etc.) van en variables de entorno (`.env.local` y en Vercel), **nunca** en el código ni en git.
- Activar Row Level Security (RLS) en todas las tablas de Supabase.
- Los cambios a la base de datos se guardan como migraciones en `supabase/migrations/`.

## Estructura del código

```
app/login/                 Inicio de sesión
app/(app)/page.tsx         Panel (inicio): cifras del mes, gráficos, cupo 4x4, alertas de stock
lib/panel.ts               Todos los cálculos del panel
components/graficos.tsx    Gráfico de ventas por mes (tocar una columna muestra el detalle)
components/panel.tsx       Cifras, barras, columnas y medidor del cupo
app/(app)/pedidos/         Lista, nuevo, editar ([id]) y acciones del servidor
app/(app)/gastos/          Igual que pedidos
app/(app)/inventario/      Igual, más botones rápidos − / + en la lista
components/campos.tsx      Campos de formulario grandes para celular (Formulario, Opciones, Contador…)
components/estructura.tsx  Encabezado, botón flotante "+", tarjetas
lib/datos.ts               Listas fijas (tallas, estados, categorías) y tipos
lib/formato.ts             Dinero, fechas (zona America/Guayaquil), leer montos "12,50"
lib/supabase/server.ts     Cliente de Supabase en el servidor
proxy.ts                   Exige sesión en todas las páginas menos /login
supabase/migrations/       SQL de la base de datos (se pega en Supabase en orden)
```

### Reglas importantes

- **Inventario automático:** un pedido con `descontar = true` resta 1 del inventario
  (trigger `pedidos_inventario`). Cancelarlo o borrarlo lo devuelve; cambiar
  modelo/equipo/talla mueve la unidad. Sin stock, la base de datos rechaza el pedido.
  No dupliques esta lógica en el código: vive en la base de datos.
- Un pedido = una camiseta.
- **Panel:** ventas = suma de `precio` de pedidos no cancelados; ganancia = precio − `costo_total`
  del modelo (vista `pedidos_con_ganancia`). Los gastos se muestran aparte para no contar
  dos veces el envío/Geomil, que ya están en `costos_modelo`.
- **Cupo 4x4:** $1.600 por año calendario (`CUPO_4X4_ANUAL` en `lib/datos.ts`); se calcula
  con los gastos de categoría «Compra a proveedor» del año en curso.
- **Alerta de stock:** `STOCK_MINIMO` (2) en `lib/datos.ts`.
- Los formularios usan `<Formulario>` (no `<form action>`) para que React 19 no borre
  lo escrito cuando hay un error.
- Next.js 16: el middleware se llama `proxy.ts`; `params` y `searchParams` son Promesas.
- Antes de entregar: `npx tsc --noEmit` y `npm run build`.

## Rama de trabajo

Desarrollar en la rama `claude/camisetas-web-app-8m3dr1`.

## Preguntas pendientes con Mario

- ¿Precios de venta fijos por categoría o cada camiseta tiene su precio?
- ¿Cómo cobra Geomil exactamente (por libra/kilo, tarifa mínima)? ¿Cuánto suele pagar de impuestos?
- ¿Formas de pago que usa (transferencia, efectivo, Deuna, PayPal…)?
- ¿Alguien más (socio, ayudante) necesita acceso a la app?
