# Guía: publicar la app en Vercel y usarla en el celular

Tiempo: unos 10 minutos. Es gratis (plan Hobby).

**Antes de empezar** necesitas haber terminado `GUIA-SUPABASE.md`:
los 3 archivos SQL ejecutados, tu usuario creado y las 2 llaves a mano
(Project URL y Publishable key).

> Vercel cambia sus menús de vez en cuando. Si un botón tiene otro nombre,
> busca uno parecido o mándame una captura.

---

## Paso 1: Crear la cuenta

1. Entra a **https://vercel.com** y pulsa **Sign Up**.
2. Elige el plan **Hobby** (gratis) y escribe tu nombre.
3. Pulsa **Continue with GitHub** y acepta los permisos.

## Paso 2: Importar tu proyecto

1. En tu panel de Vercel pulsa **Add New…** → **Project**.
2. En la lista de repositorios de GitHub busca **Mario-M** y pulsa **Import**.
   - Si no aparece: pulsa **Adjust GitHub App Permissions** (o *Configure GitHub App*),
     da acceso al repositorio `Mario-M`, guarda y vuelve.
3. En la pantalla de configuración:
   - **Project Name:** `panel-camisetas` (este nombre será parte de tu link).
   - **Framework Preset:** debe decir **Next.js** (lo detecta solo).
   - No cambies nada en *Build and Output Settings*.

## Paso 3: Poner las llaves de Supabase

En la misma pantalla abre **Environment Variables** y agrega estas dos
(copia los nombres **exactos**, con mayúsculas y guiones bajos):

| Key (nombre) | Value (valor) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL, ej. `https://abcdxyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | tu Publishable key, `sb_publishable_...` |

> Usa la **Publishable key**, nunca la *Secret key*.
> Revisa que no se cuele un espacio al inicio o al final al pegar.

## Paso 4: Publicar

1. Pulsa **Deploy**.
2. Espera 1 o 2 minutos. Cuando veas confeti 🎉 y **Congratulations!**, está publicada.
3. Pulsa **Continue to Dashboard**. Bajo **Domains** verás tu link, algo como
   `https://panel-camisetas.vercel.app` (o con letras extra si el nombre ya existía).

Si sale un error rojo en vez del confeti, copia las últimas líneas del registro
(*Build Logs*) y mándamelas.

## Paso 5: Probar

1. Abre el link y entra con tu correo y contraseña de Supabase.
2. Registra un gasto de prueba y bórralo, para confirmar que todo guarda.

Si entras y sale **"No tienes acceso"**: tu correo no está en la tabla
`usuarios_permitidos` (o está escrito distinto). Corrígelo en Supabase →
Table Editor → `usuarios_permitidos`.

## Paso 6: Instalarla en el celular

Así queda con su ícono en la pantalla de inicio y se abre a pantalla completa,
como una app normal.

**iPhone (usa Safari):**
1. Abre el link en **Safari**.
2. Toca el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Baja y toca **Agregar a pantalla de inicio** → **Agregar**.

**Android (usa Chrome):**
1. Abre el link en **Chrome**.
2. Toca el menú **⋮** (arriba a la derecha).
3. Toca **Agregar a pantalla principal** (o **Instalar app**) → **Instalar**.

La sesión queda guardada, así que no tendrás que escribir la contraseña cada vez.

## Paso 7 (recomendado): Avisarle a Supabase tu link

En Supabase → **Authentication** → **URL Configuration**:
- **Site URL:** pega tu link de Vercel (ej. `https://panel-camisetas.vercel.app`) y guarda.

---

## ¿Y cuando haga cambios a la app?

No tienes que hacer nada. Cada vez que yo suba cambios a GitHub, Vercel publica
la nueva versión sola en 1 o 2 minutos, en el mismo link.

## Si algo sale mal

| Qué pasa | Qué hacer |
|---|---|
| La página dice "Application error" o no carga | Revisa en Vercel → *Settings* → *Environment Variables* que las 2 llaves estén bien escritas. Si cambias algo, ve a *Deployments* → los **⋯** del último → **Redeploy**. |
| "Correo o contraseña incorrectos" | Revisa el usuario en Supabase → Authentication → Users. Ahí puedes cambiarle la contraseña. |
| "No tienes acceso" | Tu correo no está en `usuarios_permitidos` (ver Paso 5). |
| No se ven datos o no guarda | Confirma que ejecutaste los 3 archivos SQL en orden. |
