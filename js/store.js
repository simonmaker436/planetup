// ============================================================
// store.js — Guarda los datos en el celular. Sin servidor ni login.
//   • Store: progreso (localStorage)
//   • Fotos: fotos de prueba de los retos (IndexedDB, aguanta más peso)
// ============================================================

const Store = (() => {
  const KEY = 'planetup:v1';

  const vacio = () => ({
    nombre: '',
    creado: new Date().toISOString(),
    perfil: null,        // respuestas del onboarding
    completados: {},     // { '2026-11-19': ['termo', 'ducha'] }
    animo: {},           // { '2026-11-19': 4 }
    sets: {},            // retos que salieron cada día { fecha: [ids] }
    logros: {},          // { primero: '2026-11-19' }
    escudosUsados: [],   // fechas salvadas por un escudo
    fotos: [],           // claves 'fecha|reto' de las fotos guardadas
    recordatorio: null,  // '19:00'
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign(vacio(), JSON.parse(raw)) : vacio();
    } catch (e) { return vacio(); }
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento: sigue en memoria */ }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    Fotos.borrarTodo();
    return vacio();
  }

  return { load, save, reset };
})();

const Fotos = (() => {
  let dbPromesa = null;
  const memoria = new Map(); // respaldo si IndexedDB no está disponible

  function db() {
    if (!dbPromesa) {
      dbPromesa = new Promise(res => {
        try {
          const req = indexedDB.open('planetup', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('fotos');
          req.onsuccess = () => res(req.result);
          req.onerror = () => res(null);
        } catch (e) { res(null); }
      });
    }
    return dbPromesa;
  }

  async function op(modo, fn) {
    const d = await db();
    if (!d) return fn(null);
    return new Promise(res => {
      const tx = d.transaction('fotos', modo), st = tx.objectStore('fotos');
      const req = fn(st);
      if (req) { req.onsuccess = () => res(req.result); req.onerror = () => res(null); }
      else tx.oncomplete = () => res(null);
    });
  }

  // Reduce la foto a máx. 900 px y la comprime para que pese poco
  function comprimir(archivo) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(archivo), img = new Image();
      img.onload = () => {
        const max = 900, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = rej;
      img.src = url;
    });
  }

  async function guardar(clave, archivo) {
    const data = await comprimir(archivo);
    memoria.set(clave, data);
    await op('readwrite', st => st ? st.put(data, clave) : null);
    return data;
  }

  async function leer(clave) {
    if (memoria.has(clave)) return memoria.get(clave);
    const data = await op('readonly', st => st ? st.get(clave) : null);
    if (data) memoria.set(clave, data);
    return data;
  }

  async function borrar(clave) { memoria.delete(clave); await op('readwrite', st => st ? st.delete(clave) : null); }
  async function borrarTodo() { memoria.clear(); await op('readwrite', st => st ? st.clear() : null); }

  return { guardar, leer, borrar, borrarTodo };
})();
