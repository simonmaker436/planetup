# PlanetUp

App web (PWA) de retos ecológicos diarios: sube de nivel del 1 al 10, mantén tu racha y cuida el planeta.

- Sin servidor ni login: los datos se guardan en el celular (localStorage).
- La Tierra del fondo usa imágenes reales de la NASA (three.js).

## Estructura
- `index.html` — página principal
- `css/styles.css` — diseño (colores arriba del archivo)
- `js/data.js` — retos, niveles y ánimos (aquí se agregan retos nuevos)
- `js/store.js` — guardado en el dispositivo
- `js/logic.js` — cálculos: puntos, racha, niveles, impacto, liga
- `js/ui.js` — pantallas
- `js/fx.js` — confeti y animaciones
- `js/globe.js` — la Tierra 3D
- `js/app.js` — arranque y eventos
- `img/3d/` — ilustraciones 3D · `img/earth/` — texturas de la Tierra

## Correr en local
```
python3 -m http.server 8000
```
y abrir http://localhost:8000

## Deploy
Cada `git push` a `main` se publica solo en Vercel.
