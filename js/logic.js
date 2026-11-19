// ============================================================
// logic.js — Cálculos: fechas, puntos, racha, niveles, impacto
// No toca la pantalla, solo recibe el estado y devuelve datos.
// ============================================================

const Logic = (() => {
  const retoPorId = Object.fromEntries(RETOS.map(r => [r.id, r]));

  // ---------- Fechas ----------
  function claveFecha(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function sumarDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function inicioSemana(d = new Date()) { // lunes
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dia = (x.getDay() + 6) % 7;
    return sumarDias(x, -dia);
  }

  // ---------- Aleatorio con semilla (mismo resultado todo el día) ----------
  function semilla(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  // ---------- Retos ----------
  function retosDelDia(fecha = claveFecha()) {
    const rnd = semilla('retos-' + fecha);
    const mezcla = [...RETOS].sort(() => rnd() - 0.5);
    const elegidos = [], cats = new Set();
    for (const r of mezcla) { // prioriza categorías distintas
      if (elegidos.length >= RETOS_POR_DIA) break;
      if (!cats.has(r.cat)) { elegidos.push(r); cats.add(r.cat); }
    }
    for (const r of mezcla) {
      if (elegidos.length >= RETOS_POR_DIA) break;
      if (!elegidos.includes(r)) elegidos.push(r);
    }
    return elegidos;
  }

  function hechosHoy(state) { return state.completados[claveFecha()] || []; }

  function toggleReto(state, id) {
    const k = claveFecha();
    const lista = state.completados[k] || [];
    state.completados[k] = lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
    if (!state.completados[k].length) delete state.completados[k];
  }

  // ---------- Puntos, racha y niveles ----------
  function todosLosHechos(state) {
    return Object.values(state.completados).flat().map(id => retoPorId[id]).filter(Boolean);
  }

  function puntosTotales(state) { return todosLosHechos(state).reduce((s, r) => s + r.pts, 0); }

  function puntosEntre(state, desde, hasta) {
    let total = 0;
    for (const [k, ids] of Object.entries(state.completados)) {
      if (k >= desde && k <= hasta) total += ids.reduce((s, id) => s + (retoPorId[id]?.pts || 0), 0);
    }
    return total;
  }

  function racha(state) {
    let d = new Date();
    if (!state.completados[claveFecha(d)]) d = sumarDias(d, -1); // hoy aún puede completarse
    let n = 0;
    while (state.completados[claveFecha(d)]) { n++; d = sumarDias(d, -1); }
    return n;
  }

  function nivelActual(puntos) {
    let actual = NIVELES[0];
    for (const nv of NIVELES) if (puntos >= nv.min) actual = nv;
    const sig = NIVELES.find(nv => nv.n === actual.n + 1) || null;
    const progreso = sig ? (puntos - actual.min) / (sig.min - actual.min) : 1;
    return { actual, sig, progreso, faltan: sig ? sig.min - puntos : 0 };
  }

  // ---------- Impacto ----------
  function impacto(state) {
    return todosLosHechos(state).reduce((t, r) => {
      t.co2 += r.co2; t.agua += r.agua; t.plastico += r.plastico; t.retos++; return t;
    }, { co2: 0, agua: 0, plastico: 0, retos: 0 });
  }

  // ---------- Ánimo ----------
  function ultimos7(state) {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = sumarDias(new Date(), -i), k = claveFecha(d);
      dias.push({ k, d, retos: (state.completados[k] || []).length, animo: state.animo[k] || null });
    }
    return dias;
  }

  function animoConVsSin(state) {
    const con = [], sin = [];
    for (const [k, v] of Object.entries(state.animo)) ((state.completados[k] || []).length ? con : sin).push(v);
    const prom = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
    return { con: prom(con), sin: prom(sin) };
  }

  // ---------- Sugerencia inteligente ----------
  // Busca la categoría que menos has hecho en los últimos 7 días y sugiere un reto de ella.
  function sugerencia(state) {
    const conteo = Object.fromEntries(Object.keys(CATEGORIAS).map(c => [c, 0]));
    for (let i = 0; i < 7; i++) {
      for (const id of state.completados[claveFecha(sumarDias(new Date(), -i))] || []) {
        const r = retoPorId[id]; if (r) conteo[r.cat]++;
      }
    }
    const hoy = hechosHoy(state);
    const orden = Object.entries(conteo).sort((a, b) => a[1] - b[1]).map(e => e[0]);
    const rnd = semilla('sug-' + claveFecha());
    for (const cat of orden) {
      const opciones = RETOS.filter(r => r.cat === cat && !hoy.includes(r.id));
      if (opciones.length) {
        const reto = opciones[Math.floor(rnd() * opciones.length)];
        const motivo = conteo[cat] === 0
          ? `Esta semana no has hecho retos de ${CATEGORIAS[cat].nombre.toLowerCase()}.`
          : `Es la categoría que menos has trabajado esta semana.`;
        return { reto, motivo };
      }
    }
    return null;
  }

  // ---------- Liga semanal (amigos de demostración) ----------
  function liga(state) {
    const lunes = inicioSemana();
    const desde = claveFecha(lunes), hasta = claveFecha(sumarDias(lunes, 6));
    const diaSemana = ((new Date().getDay() + 6) % 7) + 1; // 1..7
    const filas = AMIGOS_DEMO.map(nombre => {
      const rnd = semilla(nombre + desde);
      const ritmo = 12 + rnd() * 28; // puntos por día
      return { nombre, pts: Math.round(ritmo * diaSemana), yo: false };
    });
    filas.push({ nombre: state.nombre || 'Tú', pts: puntosEntre(state, desde, hasta), yo: true });
    return filas.sort((a, b) => b.pts - a.pts);
  }

  // ---------- Semana actual (lunes a domingo) para la tira de días ----------
  function semana(state) {
    const lunes = inicioSemana(), hoy = claveFecha();
    return Array.from({ length: 7 }, (_, i) => {
      const d = sumarDias(lunes, i), k = claveFecha(d);
      return { k, d, retos: (state.completados[k] || []).length, hoy: k === hoy, futuro: k > hoy };
    });
  }

  // Tiempo que falta para que termine la liga (domingo 23:59)
  function finDeLiga() {
    const fin = sumarDias(inicioSemana(), 7);
    const ms = fin - new Date();
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  }

  return {
    retoPorId, claveFecha, retosDelDia, hechosHoy, toggleReto, puntosTotales, racha,
    nivelActual, impacto, ultimos7, animoConVsSin, sugerencia, liga, semana, finDeLiga,
  };
})();
