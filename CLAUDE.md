# Panel de camisetas — contexto del negocio

Este archivo le da a Claude Code todo el contexto del negocio. Léelo antes de cada tarea.
(Las secciones de negocio las escribió Mario; las "Notas técnicas" del final describen el código actual.)

## Sobre mí y cómo trabajar conmigo

- Soy Mario, estudiante de odontología en Quito, Ecuador. **No soy programador.**
- Explícame cada paso en español y con palabras simples.
- Avanza en pasos pequeños. Antes de seguir, dime cómo probar lo que hiciste.
- Guarda los cambios en GitHub (commit) al terminar cada paso.
- Antes de cambios grandes (borrar datos, cambiar la base de datos, publicar), explica qué vas a hacer y pide confirmación.
- Moneda: dólares (USD). Zona horaria: America/Guayaquil. Fechas en formato dd/mm/aaaa.
- La app tiene que verse y usarse bien en el celular.

## El negocio

Vendo camisetas de fútbol importadas (réplicas en versión fan, jugador y retro) por Instagram (~1.200 seguidores) y WhatsApp, en Quito y con envíos al resto de Ecuador.

- Las camisetas se venden siempre como "versión fan", "versión jugador" o "retro". **Nunca como originales.**
- Modelo de venta: **preventa** (el cliente paga un anticipo del 50% y recibe en unas 3 semanas) y **stock** de los modelos que más se venden.
- Entregas: en mano en Quito y la USFQ, y por Servientrega al resto del país.
- Cambios: solo de talla, hasta 3 días después de entregar y sin uso. Las camisetas personalizadas con nombre no tienen cambio.

## Proveedor principal: SoccerPlus (China)

- Catálogo: https://soccerplus.x.yupoo.com/ · contacto por Telegram · pago por PayPal.

| Modelo | Precio proveedor (USD) |
| --- | --- |
| Fan manga corta (también mujer) | 12 |
| Fan manga larga / Niños | 14 |
| Jugador Adidas | 15 |
| Jugador Nike / Puma / Jordan / NB | 17 |
| Retro | 16 (+3 con nombre y número) |

- Tallas grandes: XXL +$1 · 3XL–4XL +$2.
- Extras: nombre y número estrella $2 · personalizado $3 · parches $1 c/u.
- Descuento: 2–5% desde 5 unidades.
- Envío China → Miami:
  - USPS (15–20 días): gratis desde 6 unidades.
  - UPS / FedEx (7–13 días): $2 por unidad, mínimo 10.
  - SZ-FedEx (5–8 días): $3 por unidad, mínimo 10.
- Preparación del pedido: 2–6 días.

Proveedor alternativo: **GMKits** (https://www.gmkitse.com/). Fan desde $14,50, con descuento por volumen de 5% (5–9), 7% (10–15), 10% (16+) y 15% (50+).

## Logística: China → Miami → Quito

1. SoccerPlus envía a mi casillero **GeoBox** de Geomil en Miami.
2. **Geomil** (https://geomil-group.com/) lo trae a Quito.
   - Flete: **$4,99 por libra + IVA 15%** (mínimo 1 lb, se redondea a la libra siguiente).
   - Arancel **$20 por paquete** + **FODINFA $1**.
   - Entrega a domicilio $3,85 (opcional, o retiro en oficina).
   - Límite por paquete (régimen courier 4x4): **8 lb y $400 de valor**.
3. **Cupo 4x4:** $1.600 al año en valor de compra (FOB). Pasado ese cupo, la importación tiene que ser formal (servicio de carga para emprendedores de Geomil).
4. Tiempo total con envío rápido: unas 2–3 semanas.

Lo óptimo son 12 camisetas por paquete (~7–8 lb) para repartir el arancel de $20.

## Cálculo del costo por camiseta

```
costo_unitario = precio_proveedor × (1 − descuento)
               + envío_a_miami_por_unidad
               + (costo_geomil_del_paquete × peso_de_la_camiseta / peso_total_del_paquete)

costo_geomil_del_paquete = libras_cobradas × 4.99 × 1.15 + 20 + 1 + entrega_domicilio
libras_cobradas = max(1, redondear_hacia_arriba(peso_total))
```

Pesos estimados por camiseta (hay que confirmarlos con el primer paquete real): fan manga corta 0,6 lb · fan manga larga 0,7 · jugador 0,5 · retro 0,6.

Costos aproximados en Quito (pedido de 12, UPS, retiro en oficina): fan corta ~$18,90 · fan larga ~$21,70 · jugador Adidas ~$20,90 · jugador Nike ~$22,90 · retro ~$22,80.

## Precios de venta

| Modelo | Precio sugerido (USD) |
| --- | --- |
| Fan manga corta | 30–35 |
| Fan manga larga | 33–36 |
| Jugador Adidas | 38–40 |
| Jugador Nike / Puma | 40–42 |
| Retro | 35–38 |
| Nombre y número | +5 a +8 |

Referencia del mercado: La Galería del Gol cobra fan ~$37,80, jugador ~$45,50 y retro $35–41 en oferta. Las originales cuestan $75–170.

## Impuestos (Ecuador)

- Tengo RUC como persona natural, régimen **RIMPE – Emprendedor**.
- Facturación electrónica. El IVA es del **15%** y los precios al cliente lo incluyen.
  - IVA de una venta = precio / 1,15 × 0,15
  - Ingreso neto = precio / 1,15
- Hay que declarar aunque las ventas sean $0. La app debe recordarme las fechas de declaración y guardar los comprobantes.

## Base de datos (Supabase) — diseño objetivo

> Estado: implementado en la migración `20261126000000_diseno_nuevo.sql` (paso 1).
> Extra: `modelos.costo_estimado` (costo usado en preventas hasta tener costos de proveedores) y `modelos.orden`;
> vistas `pedidos_detalle` e `inventario_detalle`.

### Tabla `modelos`
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| nombre | text | Fan manga corta, Fan manga larga, Jugador Adidas, Jugador Nike / Puma / Jordan / NB, Retro |
| precio_proveedor | numeric | |
| peso_lb | numeric | |
| precio_venta_sugerido | numeric | |

### Tabla `lotes` (cada importación)
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| fecha_pedido | date | |
| fecha_llegada | date | null hasta que llega |
| proveedor | text | SoccerPlus, GMKits |
| metodo_envio | text | USPS, UPS/FedEx, SZ-FedEx |
| costo_proveedor | numeric | lo que pagué por PayPal |
| costo_envio_miami | numeric | |
| peso_lb | numeric | |
| costo_geomil | numeric | |
| guia | text | número de seguimiento |
| estado | text | Pedido, En Miami, En Quito, Recibido |

### Tabla `inventario`
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| modelo_id | uuid → modelos | |
| equipo | text | ej. "Real Madrid 26/27 local" |
| talla | text | S, M, L, XL, 2XL, 3XL, Niño |
| cantidad | int | |
| costo_unitario | numeric | se calcula con el lote |
| lote_id | uuid → lotes | |

### Tabla `clientes`
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| nombre | text | |
| instagram | text | |
| whatsapp | text | |
| ciudad | text | |
| equipo_favorito | text | |

### Tabla `pedidos`
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| fecha | date | |
| cliente_id | uuid → clientes | |
| modelo_id | uuid → modelos | |
| equipo | text | |
| talla | text | |
| personalizacion | text | nombre y número, opcional |
| precio_venta | numeric | IVA incluido |
| anticipo | numeric | |
| saldo | numeric | calculado: precio − anticipo |
| estado | text | Preventa, Pagado, Entregado, Cancelado |
| entrega | text | Quito en mano, USFQ, Servientrega |
| costo | numeric | costo unitario guardado al momento de la venta |
| inventario_id | uuid → inventario | null si es preventa |

Al registrar una venta con stock, hay que **descontar 1 del inventario**. El costo se **guarda en el pedido** para que no cambie si después cambian los precios del proveedor.

### Tabla `gastos`
| campo | tipo | notas |
| --- | --- | --- |
| id | uuid | |
| fecha | date | |
| concepto | text | |
| categoria | text | Compra a proveedor, Envío a Miami, Geomil, Envío local, Publicidad, Empaques, Impuestos, Otros |
| monto | numeric | |
| tipo | text | calculado: "Mercadería" (las 3 primeras categorías) u "Operativo" |
| lote_id | uuid → lotes | opcional |

## Panel de control (lo que necesito ver)

- Mes seleccionable. Indicadores principales en una fila:
  - Ventas del mes
  - Ganancia del mes = (precio/1,15 − costo) de los pedidos no cancelados − gastos operativos
  - Camisetas vendidas
  - Por cobrar (saldo de las preventas)
  - Pedidos por entregar
  - Camisetas en stock
- Gráfico de ventas y ganancia por mes.
- Modelos y equipos más vendidos.
- Stock por modelo y talla, con alerta cuando quedan menos de 2.
- Cupo 4x4 usado en el año (compras a proveedor / $1.600), con alerta al pasar el 80%.
- Lotes en camino y su estado.
- Recordatorio de declaraciones del SRI.

## Marca: FutAddicts

- Instagram: @futaddicts · "Camisetas de fútbol Ecuador" · WhatsApp +593 99 993 1261.
- Estilo: **monocromático oscuro**. Fondo negro azulado del logo `#14191F`, líneas y botones blancos,
  letra cuadrada **Orbitron** solo en títulos. Logo: camiseta en líneas blancas dentro de un marco
  cuadrado con "FUTADDICTS" vertical (`public/logo-futaddicts.png`, reconstruido de una captura).
- Los colores se definen en un solo lugar: `@theme` de `app/globals.css` (la paleta zinc está
  invertida, `white` = superficie de tarjeta, `emerald` = acción blanca). Verde/amarillo/rojo
  se reservan para avisos (cupo, stock, errores).

## Tecnología

- Next.js + Supabase (base de datos y login) + Vercel (publicación gratuita).
- Solo yo tengo acceso con login. Más adelante se suma un **catálogo público** con botón "Pedir por WhatsApp".
- Importar los datos que ya tengo en mi hoja (Pedidos, Inventario, Gastos) cuando la app esté lista.

## Plan por fases

0. Bases ✅ (cuenta bancaria, capital, RUC)
1. Primer pedido de 12 y relanzamiento en Instagram
2. Registro en hojas
3. **Esta app** (panel dinámico)
4. Catálogo web público
5. Escalar: importación formal y un segundo proveedor

---

# Notas técnicas (estado actual del código)

## Ya construido y en uso

- Login + lista de correos permitidos, pedidos, gastos, inventario, modelos y costos, y panel.
- Migraciones aplicadas por Mario: 1, 2 y 3 (juntas, en "todo en uno"). La 4
  (`20261126000000_diseno_nuevo.sql`) borra las tablas de prueba y crea el diseño nuevo.
  **Cualquier cambio futuro es una migración nueva**: nunca editar las ya aplicadas.

## Decisiones de Mario

- Preventa: se guarda el **costo estimado** del modelo hasta tener costos fijos con proveedores.
- Lotes: **por ahora no** crean gastos automáticamente.

## Pendiente (en este orden)

1. ✅ Paso 1: diseño nuevo (modelos, clientes, preventa, personalización, entrega, tallas,
   costo guardado en el pedido, gastos Mercadería/Operativo, ganancia sin IVA).
2. ✅ Paso 2: **lotes** (migración `20261127000000_lotes.sql`): tabla `lote_items`, cálculo de costo
   en `lib/costos.ts` (descuento, recargo 2XL/3XL/Niño, envío a Miami por método, Geomil por libra
   redondeada + IVA + $21; Geomil se reparte por peso; valores reales reemplazan al cálculo).
   "Recibir en Quito" = función `recibir_lote()`: pasa todo al inventario con su costo y asigna
   las preventas elegidas (que toman el costo real). Panel muestra lotes en camino.
3. Paso 3: panel completo: mes seleccionable, gráfico de ventas y ganancia, stock por modelo y talla.
4. Paso 4: recordatorio de declaraciones del SRI y comprobantes.
5. Después: catálogo público con "Pedir por WhatsApp" e importar la hoja de cálculo.

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
app/(app)/modelos/         Editar costo estimado, precio sugerido, precio proveedor y peso
app/(app)/lotes/           Lista, nuevo, ver/editar + "Recibir en Quito"
lib/costos.ts              Fórmula de costo por camiseta de un lote (Geomil, envío, descuento)
components/deslizar.tsx   Deslizar ← borrar / → acción rápida, con aviso «Deshacer» (borra a los 5 s)
components/TirarParaActualizar.tsx  Tirar hacia abajo para recargar
components/NumeroAnimado.tsx        Números del panel que suben contando
components/esqueleto.tsx   Siluetas de carga (cada ruta tiene su loading.tsx)
app/(app)/template.tsx     Animación de entrada de cada pantalla
components/campos.tsx      Campos de formulario grandes para celular (Formulario, Opciones, Contador…)
components/estructura.tsx  Encabezado, botón flotante "+", tarjetas
lib/datos.ts               Listas fijas (tallas, estados, categorías) y tipos
lib/formato.ts             Dinero, fechas (zona America/Guayaquil), leer montos "12,50"
lib/supabase/server.ts     Cliente de Supabase en el servidor
proxy.ts                   Exige sesión en todas las páginas menos /login
supabase/migrations/       SQL de la base de datos (se pega en Supabase en orden)
```

### Reglas importantes

- **Inventario automático:** un pedido con `inventario_id` (venta de stock) resta 1 de esa fila
  (triggers `pedidos_preparar` y `pedidos_inventario`). La base de datos copia modelo/equipo/talla
  del inventario y guarda `costo` al crear el pedido (stock: `costo_unitario`; preventa:
  `modelos.costo_estimado`); el costo no cambia aunque cambien los precios. Cancelar o borrar
  devuelve la camiseta. No dupliques esta lógica en el código: vive en la base de datos.
- Un pedido = una camiseta. Clientes: se buscan por nombre (sin mayúsculas) o se crean al guardar el pedido.
- **Panel:** ventas = Σ `precio_venta` (con IVA); ganancia del mes = Σ(`precio_venta`/1,15 − `costo`)
  − gastos `tipo = 'Operativo'`. Los gastos de mercadería no se restan (ya están en el costo).
- **Cupo 4x4:** $1.600 por año calendario (`CUPO_4X4_ANUAL`), alerta desde 80%; se calcula con
  los gastos «Compra a proveedor» del año.
- **Acceso:** dos candados. `proxy.ts` exige sesión; `app/(app)/layout.tsx` llama a
  `rpc("es_permitido")` y manda a `/sin-acceso` si el correo no está en
  `usuarios_permitidos`. Las políticas RLS de todas las tablas usan `es_permitido()`,
  así que la protección real está en la base de datos.
- **Publicación:** Vercel publica automáticamente la rama principal del repositorio
  (`claude/camisetas-web-app-8m3dr1`). Variables: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Guía en `GUIA-VERCEL.md`.
- **Alerta de stock:** cuando quedan menos de `STOCK_ALERTA_MENOS_DE` (2), en `lib/datos.ts`.
- Los formularios usan `<Formulario>` (no `<form action>`) para que React 19 no borre
  lo escrito cuando hay un error.
- **Animaciones:** definidas en `@theme` de `app/globals.css` (`animate-entrada`, `aviso`, `crecer-x/y`,
  `trazo`, `vaciar`). La de entrada usa `backwards` (no `both`): si deja un `transform` aplicado,
  los botones flotantes `fixed` se descolocan. Todo se apaga con "Reducir movimiento".
- Next.js 16: el middleware se llama `proxy.ts`; `params` y `searchParams` son Promesas.
- Antes de entregar: `npx tsc --noEmit` y `npm run build`.

## Rama de trabajo

Desarrollar en la rama `claude/camisetas-web-app-8m3dr1`.
