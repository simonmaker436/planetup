// ============================================================
// store.js — Guarda y carga los datos en el celular (localStorage)
// Sin servidor ni login: todo queda en el dispositivo.
// ============================================================

const Store = (() => {
  const KEY = 'planetup:v1';

  const vacio = () => ({
    nombre: '',
    creado: new Date().toISOString(),
    completados: {}, // { '2026-11-19': ['termo', 'ducha'] }
    animo: {},       // { '2026-11-19': 4 }
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return vacio();
      return Object.assign(vacio(), JSON.parse(raw));
    } catch (e) {
      return vacio();
    }
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento: sigue en memoria */ }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    return vacio();
  }

  return { load, save, reset };
})();
