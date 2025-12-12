# Instrucciones de Migración a Supabase

## Estado Actual

✅ **Supabase conectado correctamente**  
✅ **Políticas RLS configuradas (permisivas)**  
❌ **Esquema de tablas no coincide con el código**

## Problema Identificado

Las tablas en Supabase están usando UUIDs como IDs primarios:
```sql
id: "18687e1e-1abc-4d1b-a147-b10cd102f9dd"
```

Pero el código de la aplicación espera integers (BIGSERIAL):
```typescript
id: number
```

## Solución

Ejecutar el script SQL `supabase-migration-fix.sql` en el SQL Editor de Supabase.

### Pasos:

1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar el contenido de `supabase-migration-fix.sql`
4. Ejecutar el script
5. Verificar que las tablas se crearon correctamente

El script hará lo siguiente:
- Eliminar las tablas existentes
- Recrear `agencias` y `recepcionistas` con BIGSERIAL IDs
- Configurar RLS con políticas permisivas
- Insertar datos de prueba

### Datos de Prueba Incluidos

**Recepcionistas:**
- Juan (admin) - juani.finanzas@gmail.com
- Sinara (staff) - srs.sinara@gmail.com

**Agencias:**
- Clerton Turismo (Transfer)
- Mauro Passeios (Passeio)

## Verificación

Después de ejecutar la migración, la app debería:
1. Cargar la página de Agências correctamente
2. Mostrar las 2 agencias de prueba
3. Permitir crear, editar y eliminar agencias

## Conexión Verificada

✅ URL: https://bojihtcarngbxyqtbbbv.supabase.co  
✅ Anon Key configurada  
✅ SELECT funcionando  
✅ INSERT funcionando  
✅ DELETE funcionando
