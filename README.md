# PlanetUp

App web (PWA) de retos ecológicos diarios: sube de nivel del 1 al 10, mantén tu racha y cuida el planeta.

- Sin servidor ni login: los datos se guardan en el celular (localStorage).
- La Tierra del fondo usa imágenes reales de la NASA (three.js).

## Estructura
- `index.html` — página principal
- `css/styles.css` — diseño (colores arriba del archivo)
- `js/data.js` — retos, niveles, ánimos, retos semanales, logros y preguntas del onboarding (aquí se agrega contenido nuevo)
- `js/store.js` — guardado en el dispositivo (progreso en localStorage, fotos en IndexedDB)
- `js/logic.js` — cálculos: puntos, racha, niveles, impacto, liga
- `js/ui.js` — pantallas
- `js/fx.js` — confeti y animaciones
- `js/tarjeta.js` — imagen para compartir y recordatorio de calendario
- `js/globe.js` — la Tierra 3D
- `js/app.js` — arranque y eventos
- `img/3d/` — ilustraciones 3D · `img/earth/` — texturas de la Tierra
- `recordatorios/` — archivos de calendario (.ics) con evento diario, uno cada 15 min

## Correr en local
```
python3 -m http.server 8000
```
y abrir http://localhost:8000

## Deploy
Cada `git push` a `main` se publica solo en Vercel.
