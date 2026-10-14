# EduPlan escolar — versión corregida

## Desarrollo
Requiere Node.js 22.12 o posterior.

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Publicación gratis con Netlify
1. Subir el contenido del proyecto a un repositorio de GitHub.
2. Netlify > Add new project > Import an existing project > GitHub.
3. Build: `npm run build`; carpeta publicada: `dist` (ya están en `netlify.toml`).
4. Publicar y abrir el enlace HTTPS que termina en `.netlify.app`.

## Límites y funcionamiento
- Datos locales en IndexedDB; exportar una copia periódicamente desde el menú de respaldo. **No hay sincronización entre dispositivos**.
- Alertas locales mientras la aplicación está activa; no hay push programado en segundo plano ni garantías con la aplicación cerrada.
- PDF con texto seleccionable y DOCX usan analizadores reales (`pdfjs-dist` y `mammoth`). Los escaneos y fotografías necesitan OCR; se muestra error explícito.
- Si faltan fechas, se proponen fechas editables, **no se consideran oficiales**; antes de guardarlas se pide confirmación.
- No se fabrican tareas al no detectar actividades y las instalaciones nuevas empiezan vacías.
- Para sincronización segura multiusuario y notificaciones remotas, implementar backend (ej. Supabase/Firebase), autenticación, políticas RLS y servicio de notificaciones.

**Verificación en este entorno:** se entregan cambios en el código; si no fue posible instalar dependencias, la compilación no está verificada. Ejecutar `npm install && npm run lint && npm run build` antes del despliegue.
