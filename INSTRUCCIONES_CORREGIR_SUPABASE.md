# ⚠️ ACCIÓN REQUERIDA: Corregir Esquema de Supabase

## Problema Detectado

La tabla `agencias` en Supabase no tiene el esquema correcto. La columna `tipo` no existe o el esquema no coincide con el código.

## Solución: Ejecutar Script SQL en Supabase

Sigue estos pasos **EXACTAMENTE**:

### 1️⃣ Abrir Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Haz login con tu cuenta
3. Selecciona el proyecto: `bojihtcarngbxyqtbbbv`

### 2️⃣ Abrir SQL Editor

1. En el menú lateral izquierdo, busca el ícono **SQL Editor** (parece un terminal/consola)
2. Haz click en **SQL Editor**
3. Haz click en **New Query** (botón en la parte superior)

### 3️⃣ Copiar y Ejecutar el Script

1. Abre el archivo `supabase-migration-fix.sql` que está en la raíz del proyecto
2. Copia **TODO** el contenido del archivo
3. Pega el contenido en el SQL Editor de Supabase
4. Haz click en **Run** (o presiona Ctrl+Enter / Cmd+Enter)

### 4️⃣ Verificar que Funcionó

Después de ejecutar el script, deberías ver un mensaje de éxito. Luego:

1. Refresca la página de tu app
2. Intenta crear una agencia nuevamente
3. Debería funcionar correctamente ahora

## ¿Qué Hace el Script?

El script `supabase-migration-fix.sql`:
- ✅ Elimina las tablas viejas con estructura incorrecta
- ✅ Crea las tablas con BIGSERIAL (IDs numéricos) en lugar de UUID
- ✅ Configura permisos RLS correctos
- ✅ Agrega datos de prueba (2 recepcionistas y 2 agencias)

## Datos de Prueba Incluidos

Después de ejecutar el script, tendrás:

**Recepcionistas:**
- Juan (admin) - juani.finanzas@gmail.com
- Sinara (staff) - srs.sinara@gmail.com

**Agencias:**
- Clerton Turismo (Transfer)
- Mauro Passeios (Passeio)

## Ayuda

Si tienes problemas:
1. Verifica que estás en el proyecto correcto en Supabase
2. Asegúrate de copiar TODO el contenido del script
3. Si hay errores, lee el mensaje de error y avísame
