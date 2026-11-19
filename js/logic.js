// ============================================================
// logic.js — Cálculos: fechas, puntos, racha, escudos, niveles,
// reto semanal, logros, impacto y liga.
// No toca la pantalla: recibe el estado y devuelve datos.
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
  const deClave = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  function sumarDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function inicioSemana(d = new Date()) { // lunes
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return sumarDias(x, -((x.getDay() + 6) % 7));
  }
  const ayer = () => claveFecha(sumarDias(new Date(), -1));

  // ---------- Aleatorio con semilla (mismo resultado todo el día) ----------
  function semilla(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  // ---------- Personalización (onboarding) ----------
  function pesosCategorias(perfil) {
    const w = Object.fromEntries(Object.keys(CATEGORIAS).map(c => [c, 1]));
    if (!perfil) return w;
    for (const p of PREGUNTAS) {
      const elegidas = [].concat(perfil[p.id] || []);
      for (const op of p.opciones) if (elegidas.includes(op.v)) for (const [c, x] of Object.entries(op.pesos)) w[c] *= x;
    }
    return w;
  }

  // ---------- Retos del día ----------
  // Se eligen con pesos según tu perfil y se guardan en state.sets para que no cambien en el día.
  function generarDia(fecha, perfil) {
    const rnd = semilla('retos-' + fecha), w = pesosCategorias(perfil);
    const orden = RETOS.map(r => ({ r, k: Math.pow(rnd(), 1 / w[r.cat]) })).sort((a, b) => b.k - a.k).map(x => x.r);
    const elegidos = [], cats = new Set();
    for (const r of orden) { if (elegidos.length >= RETOS_POR_DIA) break; if (!cats.has(r.cat)) { elegidos.push(r); cats.add(r.cat); } }
    for (const r of orden) { if (elegidos.length >= RETOS_POR_DIA) break; if (!elegidos.includes(r)) elegidos.push(r); }
    return elegidos.map(r => r.id);
  }

  function retosDelDia(state, fecha = claveFecha()) {
    state.sets = state.sets || {};
    let ids = state.sets[fecha];
    if (!ids) {
      ids = generarDia(fecha, fecha === claveFecha() ? state.perfil : null);
      if (fecha === claveFecha()) state.sets[fecha] = ids; // se guarda al hacer save()
    }
    return ids.map(id => retoPorId[id]).filter(Boolean);
  }

  function hechosHoy(state) { return state.completados[claveFecha()] || []; }

  function toggleReto(state, id) {
    const k = claveFecha();
    const lista = state.completados[k] || [];
    state.completados[k] = lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id];
    if (!state.completados[k].length) delete state.completados[k];
  }

  function diaCompleto(state, k) {
    const hechos = state.completados[k] || [];
    if (hechos.length < RETOS_POR_DIA) return false;
    return retosDelDia(state, k).every(r => hechos.includes(r.id));
  }

  // ---------- Reto de la semana ----------
  function semanal(state, lunes = inicioSemana()) {
    const kLunes = claveFecha(lunes);
    const rnd = semilla('semana-' + kLunes);
    const reto = RETOS_SEMANALES[Math.floor(rnd() * RETOS_SEMANALES.length)];
    let progreso = 0;
    for (let i = 0; i < 7; i++) {
      const k = claveFecha(sumarDias(lunes, i)), ids = state.completados[k] || [];
      if (reto.tipo === 'cat') progreso += ids.filter(id => retoPorId[id]?.cat === reto.cat).length;
      if (reto.tipo === 'dias') progreso += ids.length ? 1 : 0;
      if (reto.tipo === 'completos') progreso += diaCompleto(state, k) ? 1 : 0;
    }
    const fin = sumarDias(lunes, 7);
    const diasRestantes = Math.max(0, Math.ceil((fin - new Date()) / 864e5));
    return { reto, progreso: Math.min(progreso, reto.meta), completo: progreso >= reto.meta, diasRestantes };
  }

  // Todas las semanas con actividad → cuántos retos semanales completaste y sus puntos
  function semanalesCompletados(state) {
    const fechas = Object.keys(state.completados).sort();
    if (!fechas.length) return { n: 0, pts: 0 };
    let lunes = inicioSemana(deClave(fechas[0])), n = 0, pts = 0;
    const hoy = new Date();
    while (lunes <= hoy) {
      const s = semanal(state, lunes);
      if (s.completo) { n++; pts += s.reto.pts; }
      lunes = sumarDias(lunes, 7);
    }
    return { n, pts };
  }

  // ---------- Puntos y niveles ----------
  function todosLosHechos(state) {
    return Object.values(state.completados).flat().map(id => retoPorId[id]).filter(Boolean);
  }
  function puntosRetos(state) { return todosLosHechos(state).reduce((s, r) => s + r.pts, 0); }
  function puntosTotales(state) { return puntosRetos(state) + semanalesCompletados(state).pts; }

  function puntosEntre(state, desde, hasta) {
    let total = 0;
    for (const [k, ids] of Object.entries(state.completados)) {
      if (k >= desde && k <= hasta) total += ids.reduce((s, id) => s + (retoPorId[id]?.pts || 0), 0);
    }
    const s = semanal(state, deClave(desde));
    return total + (s.completo ? s.reto.pts : 0);
  }

  function nivelActual(puntos) {
    let actual = NIVELES[0];
    for (const nv of NIVELES) if (puntos >= nv.min) actual = nv;
    const sig = NIVELES.find(nv => nv.n === actual.n + 1) || null;
    const progreso = sig ? (puntos - actual.min) / (sig.min - actual.min) : 1;
    return { actual, sig, progreso, faltan: sig ? sig.min - puntos : 0 };
  }

  // Salud del planeta (0.15 = contaminado, 1 = sano) según tu nivel
  function saludPlaneta(state) {
    const nv = nivelActual(puntosTotales(state));
    return Math.min(1, 0.15 + 0.85 * ((nv.actual.n - 1) + nv.progreso) / 9); // arranca en 15%
  }

  // ---------- Racha y escudos ----------
  // Un día cuenta si cumpliste algún reto. Un día protegido por escudo no suma pero no rompe la racha.
  const usados = state => new Set(state.escudosUsados || []);

  function racha(state) {
    const prot = usados(state);
    let d = new Date();
    if (!state.completados[claveFecha(d)]) d = sumarDias(d, -1); // hoy aún puede completarse
    let n = 0;
    for (;;) {
      const k = claveFecha(d);
      if (state.completados[k]) n++;
      else if (!prot.has(k)) break;
      d = sumarDias(d, -1);
    }
    return n;
  }

  function mejorRacha(state) {
    const fechas = Object.keys(state.completados).sort();
    if (!fechas.length) return 0;
    const prot = usados(state);
    let d = deClave(fechas[0]), mejor = 0, actual = 0;
    const hoy = claveFecha();
    while (claveFecha(d) <= hoy) {
      const k = claveFecha(d);
      if (state.completados[k]) { actual++; mejor = Math.max(mejor, actual); }
      else if (!prot.has(k) && k !== hoy) actual = 0;
      d = sumarDias(d, 1);
    }
    return mejor;
  }

  function diasCompletos(state) { return Object.keys(state.completados).filter(k => diaCompleto(state, k)).length; }

  function escudos(state) {
    const ganados = diasCompletos(state), gastados = (state.escudosUsados || []).length;
    return Math.max(0, Math.min(MAX_ESCUDOS, ganados - gastados));
  }

  // Si ayer (o varios días seguidos) no hiciste retos y tienes escudos, se usan solos.
  function aplicarEscudos(state) {
    const prot = usados(state), hueco = [];
    let d = sumarDias(new Date(), -1);
    for (let i = 0; i < 7; i++) {
      const k = claveFecha(d);
      if (state.completados[k] || prot.has(k)) break;
      hueco.push(k); d = sumarDias(d, -1);
    }
    const k = claveFecha(d);
    const habiaRacha = state.completados[k] || prot.has(k);
    if (!hueco.length || !habiaRacha || hueco.length > escudos(state)) return 0;
    state.escudosUsados = [...(state.escudosUsados || []), ...hueco];
    return hueco.length;
  }

  // ---------- Impacto ----------
  function impacto(state) {
    return todosLosHechos(state).reduce((t, r) => {
      t.co2 += r.co2; t.agua += r.agua; t.plastico += r.plastico; t.retos++; return t;
    }, { co2: 0, agua: 0, plastico: 0, retos: 0 });
  }

  // ---------- Logros ----------
  function resumen(state) {
    const imp = impacto(state);
    return {
      ...imp,
      mejorRacha: mejorRacha(state),
      diasCompletos: diasCompletos(state),
      categorias: new Set(todosLosHechos(state).map(r => r.cat)).size,
      animos: Object.keys(state.animo).length,
      fotos: (state.fotos || []).length,
      escudosUsados: (state.escudosUsados || []).length,
      semanales: semanalesCompletados(state).n,
      nivel: nivelActual(puntosTotales(state)).actual.n,
    };
  }

  // Revisa y guarda logros nuevos. Devuelve los recién desbloqueados.
  function revisarLogros(state) {
    state.logros = state.logros || {};
    const s = resumen(state), nuevos = [];
    for (const l of LOGROS) if (!state.logros[l.id] && l.cond(s)) { state.logros[l.id] = claveFecha(); nuevos.push(l); }
    return nuevos;
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
  function sugerencia(state) {
    const conteo = Object.fromEntries(Object.keys(CATEGORIAS).map(c => [c, 0]));
    for (let i = 0; i < 7; i++) {
      for (const id of state.completados[claveFecha(sumarDias(new Date(), -i))] || []) {
        const r = retoPorId[id]; if (r) conteo[r.cat]++;
      }
    }
    const hoy = hechosHoy(state), delDia = retosDelDia(state).map(r => r.id);
    const orden = Object.entries(conteo).sort((a, b) => a[1] - b[1]).map(e => e[0]);
    const rnd = semilla('sug-' + claveFecha());
    for (const cat of orden) {
      const opciones = RETOS.filter(r => r.cat === cat && !hoy.includes(r.id) && !delDia.includes(r.id));
      if (opciones.length) {
        const reto = opciones[Math.floor(rnd() * opciones.length)];
        const motivo = conteo[cat] === 0
          ? `Esta semana no has hecho retos de ${CATEGORIAS[cat].nombre.toLowerCase()}.`
          : 'Es la categoría que menos has trabajado esta semana.';
        return { reto, motivo };
      }
    }
    return null;
  }

  // ---------- Liga semanal (amigos de demostración) ----------
  function liga(state) {
    const lunes = inicioSemana();
    const desde = claveFecha(lunes), hasta = claveFecha(sumarDias(lunes, 6));
    const diaSemana = ((new Date().getDay() + 6) % 7) + 1;
    const filas = AMIGOS_DEMO.map(nombre => {
      const rnd = semilla(nombre + desde);
      return { nombre, pts: Math.round((12 + rnd() * 28) * diaSemana), yo: false };
    });
    filas.push({ nombre: state.nombre || 'Tú', pts: puntosEntre(state, desde, hasta), yo: true });
    return filas.sort((a, b) => b.pts - a.pts);
  }

  // ---------- Semana actual (tira de días) ----------
  function semana(state) {
    const lunes = inicioSemana(), hoy = claveFecha(), prot = usados(state);
    return Array.from({ length: 7 }, (_, i) => {
      const d = sumarDias(lunes, i), k = claveFecha(d);
      return { k, d, retos: (state.completados[k] || []).length, hoy: k === hoy, futuro: k > hoy, escudo: prot.has(k), completo: diaCompleto(state, k) };
    });
  }

  function finDeLiga() {
    const ms = sumarDias(inicioSemana(), 7) - new Date();
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  }

  return {
    retoPorId, claveFecha, ayer, retosDelDia, hechosHoy, toggleReto, diaCompleto,
    puntosTotales, nivelActual, saludPlaneta, racha, mejorRacha, escudos, aplicarEscudos,
    semanal, impacto, resumen, revisarLogros, ultimos7, animoConVsSin, sugerencia, liga, semana, finDeLiga,
  };
})();
