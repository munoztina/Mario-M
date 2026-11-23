# Guía: conectar Supabase (paso a paso)

Tiempo: unos 15 minutos. No necesitas instalar nada, todo se hace en el navegador.

> Supabase cambia sus menús de vez en cuando. Si un botón no tiene exactamente
> el mismo nombre, busca uno parecido o mándame una captura.

---

## Paso 1: Crear la cuenta y el proyecto

1. Entra a **https://supabase.com** y pulsa **Start your project**.
2. Regístrate con tu cuenta de **GitHub** (es lo más fácil).
3. Pulsa **New project** y llena:
   - **Name:** `panel-camisetas`
   - **Database Password:** pulsa *Generate a password* y **guárdala** en un lugar seguro (notas del celular, gestor de contraseñas). No me la mandes por el chat.
   - **Region:** elige **East US (North Virginia)**, que es la más cercana a Ecuador.
   - Plan: **Free** (gratis).
4. Pulsa **Create new project** y espera 1 o 2 minutos a que termine.

## Paso 2: Crear las tablas

1. En el menú de la izquierda entra a **SQL Editor**.
2. Pulsa **New query** (o el botón **+**).
3. Abre el archivo `supabase/migrations/20261123000000_tablas_iniciales.sql`
   de este proyecto, copia **todo** su contenido y pégalo en el editor.
4. Pulsa **Run** (o Ctrl + Enter).
5. Debe salir **"Success. No rows returned"**. Si sale un error en rojo, cópialo y mándamelo.
6. Repite lo mismo con el segundo archivo,
   `supabase/migrations/20261124000000_descontar_inventario.sql`
   (es el que hace que al vender se reste del inventario).
7. Por último, el tercer archivo:
   `supabase/migrations/20261125000000_solo_usuarios_permitidos.sql`.
   **Antes de pulsar Run**, en la última línea cambia `TU-CORREO@ejemplo.com` por
   tu correo (el mismo con el que creas tu usuario en el paso 4).
   Este archivo hace que **solo tu correo** pueda ver los datos.

   **Importante:** ejecútalos en orden (1, 2, 3) y cada uno una sola vez.

Para comprobar: en el menú izquierdo entra a **Table Editor** y deberías ver 4 tablas:

| Tabla | Para qué sirve |
|---|---|
| `costos_modelo` | Cuánto te cuesta cada tipo de camiseta y a cuánto la vendes |
| `pedidos` | Ventas a clientes |
| `gastos` | Todo lo que gastas |
| `inventario` | Camisetas que tienes en Quito |

## Paso 3: Poner tus costos reales

1. En **Table Editor** abre `costos_modelo`. Ya tiene los 5 modelos con todo en 0.
2. Haz doble clic en cada celda y escribe tus números **por unidad**:
   - `costo_proveedor`: lo que te cobra China
   - `envio_miami`: envío de China a Miami
   - `flete_geomil`: lo que cobra Geomil, dividido para las camisetas del paquete
   - `impuestos`: aduana, dividido para las camisetas del paquete
   - `precio_venta`: tu precio normal de venta
3. La columna `costo_total` se calcula sola (no la toques).

Si no sabes un número exacto todavía, pon un aproximado; luego lo cambias.

## Paso 4: Crear tu usuario (para entrar a la app)

1. Menú izquierdo: **Authentication** → **Users**.
2. Pulsa **Add user** → **Create new user**.
3. Pon tu correo y una contraseña. Marca **Auto Confirm User**.
4. Pulsa **Create user**.

Ahora **cierra la puerta a desconocidos**, para que nadie más pueda registrarse:

5. En **Authentication** busca **Sign In / Providers** (o **Settings**).
6. Desactiva **Allow new users to sign up** y guarda.

> Seguridad: hay dos candados. (1) Nadie puede registrarse solo. (2) Aunque alguien
> tuviera una cuenta, la base de datos solo muestra datos a los correos de la tabla
> `usuarios_permitidos`. Para dar acceso a otra persona (un socio, por ejemplo),
> crea su usuario aquí **y** agrega su correo en esa tabla (Table Editor).

## Paso 5: Copiar las dos "llaves" que necesita la app

1. Pulsa **Connect** (arriba en el proyecto) o ve a **Project Settings** → **API Keys**.
2. Copia estos dos datos:
   - **Project URL**: algo como `https://abcdxyz.supabase.co`
   - **Publishable key**: empieza con `sb_publishable_...`
     (en proyectos antiguos se llama **anon public**).

Estas dos llaves **sí se pueden compartir**: están hechas para ir en la app y
solo funcionan junto con tu usuario y contraseña. Puedes mandármelas por el chat.

**NUNCA compartas** la **Secret key** (`sb_secret_...` o `service_role`) ni la
contraseña de la base de datos. Esas dan acceso total.

## Paso 6: Dónde van las llaves

Cuando la app esté creada (siguiente paso del plan), las llaves van en dos sitios:

- **En tu computadora:** un archivo llamado `.env.local` (hay un ejemplo en `.env.example`).
- **En Vercel**, al publicar: *Settings* → *Environment Variables*, con estos nombres:

| Nombre | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | tu Publishable key |

Yo te aviso cuándo hacerlo.

---

## ¿Qué hace la base de datos sola?

- **Saldo del pedido:** `precio - anticipo`, o sea, lo que el cliente todavía te debe.
- **Costo total por modelo:** suma proveedor + envío + Geomil + impuestos.
- **Ganancia por pedido:** la vista `pedidos_con_ganancia` resta el costo al precio.
- **Evita errores:** no deja poner un anticipo mayor que el precio, tallas
  inventadas, montos negativos ni repetir la misma camiseta dos veces en el inventario.

Valores permitidos:

- **Tallas:** XS, S, M, L, XL, XXL, XXXL (en mayúsculas)
- **Estado del pedido:** Por encargo, Pagado, Entregado, Cancelado
- **Categorías de gasto:** Compra a proveedor, Envío China-Miami, Casillero Miami,
  Geomil, Impuestos / aduana, Publicidad, Empaques, Envío local, Comisiones de pago, Otros

Si necesitas otra talla (por ejemplo de niño) u otra categoría, me dices y la agrego.
