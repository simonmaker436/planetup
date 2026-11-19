// ============================================================
// app.js — Arranque, navegación, hojas, celebraciones y eventos
// ============================================================

(() => {
  let state = Store.load();
  let tab = 'inicio';
  let filtro = 'todas';
  let editandoNombre = false;
  let onb = null; // { paso, resp } mientras se hace el onboarding
  let tarjetaActual = null;

  const $main = document.getElementById('main');
  const $tabs = document.getElementById('tabs');
  const $toast = document.getElementById('toast');
  const $sheet = document.getElementById('sheet');
  const $overlay = document.getElementById('overlay');

  const guardar = () => Store.save(state);
  const globo = (fn, ...args) => { if (window.PlanetGlobe) window.PlanetGlobe[fn](...args); };

  // ---------- Barra de pestañas ----------
  const TABS = [['inicio', 'Inicio'], ['retos', 'Retos'], ['liga', 'Liga'], ['progreso', 'Progreso']];
  $tabs.innerHTML = `<span class="indicador"></span>` + TABS.map(([k, n]) => `<button data-tab="${k}">${UI.icono(k)}<span>${n}</span></button>`).join('');

  function moverIndicador() {
    $tabs.style.setProperty('--tab', TABS.findIndex(t => t[0] === tab));
    $tabs.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
  }

  // ---------- Planeta ----------
  function brilloDelDia() {
    const hoy = Logic.hechosHoy(state);
    return Logic.retosDelDia(state).filter(r => hoy.includes(r.id)).length / RETOS_POR_DIA;
  }
  function actualizarPlaneta(modo) {
    window.__globeMode = modo;
    globo('setMode', modo);
    const enIntro = modo === 'bienvenida' || modo === 'onboarding';
    globo('setGlow', enIntro ? 0.3 : brilloDelDia());
    globo('setHealth', enIntro && !(onb && onb.paso >= PREGUNTAS.length) ? 1 : Logic.saludPlaneta(state));
  }

  // ---------- Dibujar ----------
  function render(animar = false) {
    const enBienvenida = !state.nombre || editandoNombre;
    const enOnb = !enBienvenida && onb;
    document.body.dataset.pantalla = enBienvenida || enOnb ? 'bienvenida' : tab;
    actualizarPlaneta(enBienvenida ? 'bienvenida' : enOnb ? (onb.paso < PREGUNTAS.length ? 'onboarding' : 'bienvenida') : tab);

    if (enBienvenida || enOnb) {
      $tabs.hidden = true;
      $main.innerHTML = enBienvenida ? UI.bienvenida(editandoNombre ? state.nombre : '') : UI.onboarding(onb.paso, onb.resp, state.nombre);
      $main.className = 'animar';
      return;
    }
    $tabs.hidden = false;
    const pantallas = { inicio: UI.inicio, retos: s => UI.retos(s, filtro), liga: UI.liga, progreso: UI.progreso };
    $main.innerHTML = pantallas[tab](state);
    $main.className = animar ? 'animar' : '';
    if (animar) FX.contar($main);
    moverIndicador();
    ajustarEspacio();
    cargarFotos($main);
    guardar(); // guarda los retos del día que se acaban de elegir
  }

  // Deja el hueco justo para que se vea el planeta en Inicio (misma fórmula que globe.js)
  function ajustarEspacio() {
    const el = $main.querySelector('.espacio-planeta');
    if (!el) return;
    const base = Math.min(innerWidth, 560, innerHeight * 0.75);
    const fondoPlaneta = 0.335 * innerHeight + 0.36 * base;
    const arriba = el.getBoundingClientRect().top + scrollY;
    el.style.height = Math.max(120, fondoPlaneta - arriba - 18) + 'px';
    el.style.maxHeight = 'none';
  }
  addEventListener('resize', ajustarEspacio);

  // Pone las fotos guardadas en los <img data-foto>
  function cargarFotos(raiz) {
    raiz.querySelectorAll('img[data-foto]').forEach(async el => {
      const data = await Fotos.leer(el.dataset.foto);
      if (data) { el.src = data; el.classList.add('cargada'); }
    });
  }

  let toastTimer;
  function toast(html) {
    $toast.innerHTML = html;
    $toast.classList.remove('visible'); void $toast.offsetWidth;
    $toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('visible'), 2000);
  }

  // ---------- Hojas (panel que sube desde abajo) ----------
  function abrirHoja(html) {
    $sheet.innerHTML = html;
    $sheet.hidden = false;
    cargarFotos($sheet);
    requestAnimationFrame(() => requestAnimationFrame(() => $sheet.classList.add('abierta')));
    activarArrastre($sheet.querySelector('.hoja'));
  }
  function abrirReto(id) {
    const clave = `${Logic.claveFecha()}|${id}`;
    abrirHoja(UI.hoja(Logic.retoPorId[id], Logic.hechosHoy(state).includes(id), (state.fotos || []).includes(clave) ? clave : null));
  }
  function cerrarHoja() {
    $sheet.classList.remove('abierta');
    setTimeout(() => { if (!$sheet.classList.contains('abierta')) { $sheet.hidden = true; $sheet.innerHTML = ''; } }, 380);
  }
  function activarArrastre(el) {
    if (!el) return;
    let y0 = null, dy = 0;
    el.addEventListener('touchstart', e => { if (e.target.closest('input')) return; y0 = e.touches[0].clientY; dy = 0; el.style.transition = 'none'; }, { passive: true });
    el.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translateY(${dy}px)`; }, { passive: true });
    el.addEventListener('touchend', () => { el.style.transition = ''; el.style.transform = ''; if (dy > 110) cerrarHoja(); y0 = null; });
  }

  // ---------- Capa grande (celebraciones, tarjeta, fotos) ----------
  const cola = []; // celebraciones en espera: se muestran una tras otra
  function mostrarCapa(html, fiesta = false) {
    $overlay.innerHTML = html;
    $overlay.hidden = false;
    cargarFotos($overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => $overlay.classList.add('abierta')));
    if (fiesta) { setTimeout(() => FX.lluvia(), 250); FX.vibrar([20, 40, 20]); }
  }
  function cerrarCapa() {
    $overlay.classList.remove('abierta');
    setTimeout(() => { $overlay.hidden = true; $overlay.innerHTML = ''; siguienteCelebracion(); }, 400);
  }
  function celebrar(html) { cola.push(html); if ($overlay.hidden) siguienteCelebracion(); }
  function siguienteCelebracion() { if (cola.length && $overlay.hidden) mostrarCapa(cola.shift(), true); }

  // Revisa niveles y logros nuevos después de cualquier acción
  function revisarPremios(nivelAntes) {
    const nuevo = Logic.nivelActual(Logic.puntosTotales(state)).actual;
    if (nivelAntes && nuevo.n > nivelAntes) celebrar(UI.subioNivel(nuevo));
    for (const l of Logic.revisarLogros(state)) celebrar(UI.logroNuevo(l));
    guardar();
  }
  const nivelHoy = () => Logic.nivelActual(Logic.puntosTotales(state)).actual.n;

  // ---------- Marcar reto ----------
  function marcarReto(id, x, y, desdeHoja) {
    const nivelAntes = nivelHoy();
    const yaEstaba = Logic.hechosHoy(state).includes(id);
    Logic.toggleReto(state, id);
    guardar();
    if (desdeHoja) cerrarHoja();
    render(false);

    if (yaEstaba) { FX.vibrar(8); return; }
    $main.querySelectorAll(`[data-reto="${id}"]`).forEach(b => b.classList.add('pop'));
    FX.estallido(x, y);
    FX.vibrar(15);
    globo('boost');
    const r = Logic.retoPorId[id];
    toast(`<img src="${IMG(retoImg(r))}" alt="">+${r.pts} pts`);
    setTimeout(() => revisarPremios(nivelAntes), 450);
  }

  // ---------- Foto de prueba ----------
  async function subirFoto(id, archivo) {
    const clave = `${Logic.claveFecha()}|${id}`;
    try { await Fotos.guardar(clave, archivo); } catch (e) { toast('No se pudo leer la foto'); return; }
    state.fotos = [...new Set([...(state.fotos || []), clave])];
    const r = document.querySelector('.hoja [data-reto]')?.getBoundingClientRect();
    if (!Logic.hechosHoy(state).includes(id)) marcarReto(id, r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top : innerHeight / 2, true);
    else { guardar(); render(false); cerrarHoja(); toast('Foto guardada'); revisarPremios(); }
  }

  // ---------- Tarjeta para compartir ----------
  async function abrirTarjeta() {
    toast('Creando tu tarjeta...');
    const prev = tab; // la foto del planeta sale mejor en modo Inicio
    globo('setMode', 'inicio');
    await new Promise(r => setTimeout(r, 900));
    tarjetaActual = await Tarjeta.crear(state);
    globo('setMode', prev);
    mostrarCapa(UI.compartir(tarjetaActual.url, Tarjeta.puedeCompartir()));
  }

  // ---------- Onboarding ----------
  function empezarOnboarding(resp = {}) { onb = { paso: 0, resp: { ...resp } }; window.scrollTo(0, 0); render(); }
  function terminarOnboarding(saltado) {
    if (!saltado) {
      state.perfil = onb.resp;
      if (state.sets) delete state.sets[Logic.claveFecha()]; // los retos de hoy se vuelven a elegir con tu perfil
    } else if (!state.perfil) state.perfil = {};
    onb = null; tab = 'inicio';
    guardar(); render(true);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cerrar]')) return e.target.closest('#overlay') ? cerrarCapa() : cerrarHoja();
    const el = e.target.closest('[data-reto],[data-animo],[data-tab],[data-filtro],[data-accion],[data-abrir],[data-opcion],[data-onb],[data-logro],[data-ver-foto],[data-borrar-foto]');
    if (!el || el.disabled) return;
    const d = el.dataset;

    if (d.reto) { const r = el.getBoundingClientRect(); return marcarReto(d.reto, r.left + r.width / 2, r.top + r.height / 2, 'desdeHoja' in d); }
    if (d.abrir) return abrirReto(d.abrir);
    if (d.animo) {
      state.animo[Logic.claveFecha()] = Number(d.animo);
      guardar(); FX.vibrar(10);
      const r = el.getBoundingClientRect();
      FX.estallido(r.left + r.width / 2, r.top + r.height / 2, 14, 5);
      render(false);
      $main.querySelector(`[data-animo="${d.animo}"]`)?.classList.add('pop');
      return revisarPremios();
    }
    if (d.tab) {
      if (d.tab === tab && el.closest('#tabs')) return window.scrollTo({ top: 0, behavior: 'smooth' });
      tab = d.tab; window.scrollTo(0, 0); FX.vibrar(6); return render(true);
    }
    if (d.filtro) { filtro = d.filtro; render(false); $main.querySelector('.grilla')?.classList.add('animar-grilla'); return; }

    // Onboarding
    if (d.opcion) {
      const p = PREGUNTAS[onb.paso];
      if (p.multiple) {
        const set = new Set([].concat(onb.resp[p.id] || []));
        set.has(d.opcion) ? set.delete(d.opcion) : set.add(d.opcion);
        onb.resp[p.id] = [...set];
        el.classList.toggle('sel'); FX.vibrar(6);
        const btn = $main.querySelector('[data-onb="siguiente"]'); if (btn) btn.disabled = !set.size;
        return;
      }
      onb.resp[p.id] = d.opcion; el.classList.add('sel'); FX.vibrar(8);
      return setTimeout(() => { onb.paso++; render(); }, 260);
    }
    if (d.onb === 'siguiente') { onb.paso++; return render(); }
    if (d.onb === 'saltar') return terminarOnboarding(true);
    if (d.onb === 'fin') return terminarOnboarding(false);

    if (d.logro) { const l = LOGROS.find(x => x.id === d.logro); return abrirHoja(UI.logroInfo(l, state.logros?.[l.id])); }
    if (d.verFoto) { const r = Logic.retoPorId[d.verFoto.split('|')[1]]; return mostrarCapa(UI.verFoto(d.verFoto, r)); }
    if (d.borrarFoto) {
      Fotos.borrar(d.borrarFoto);
      state.fotos = (state.fotos || []).filter(k => k !== d.borrarFoto);
      guardar(); cerrarCapa(); return render(false);
    }

    switch (d.accion) {
      case 'nombre': editandoNombre = true; window.scrollTo(0, 0); render(); document.getElementById('input-nombre')?.focus(); return;
      case 'perfil': return empezarOnboarding(state.perfil || {});
      case 'info-escudo': return abrirHoja(UI.infoEscudo(Logic.escudos(state)));
      case 'recordatorio': return abrirHoja(UI.recordatorio(state.recordatorio));
      case 'guardar-recordatorio': {
        const v = document.getElementById('hora-recordatorio').value || '19:00';
        let [h, m] = v.split(':').map(Number);
        m = Math.round(m / 15) * 15; if (m === 60) { m = 0; h = (h + 1) % 24; } // archivos cada 15 min
        state.recordatorio = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        guardar(); cerrarHoja(); render(false);
        return Tarjeta.abrirRecordatorio(state.recordatorio);
      }
      case 'quitar-recordatorio': state.recordatorio = null; guardar(); cerrarHoja(); toast('Recordatorio quitado. Bórralo también de tu calendario.'); return render(false);
      case 'compartir': return abrirTarjeta();
      case 'compartir-ya': if (tarjetaActual) Tarjeta.compartir(tarjetaActual.blob); return;
      case 'reset':
        // Doble toque para confirmar (sin ventanas emergentes)
        if (d.confirmar) { state = Store.reset(); tab = 'inicio'; editandoNombre = false; onb = null; return render(true); }
        d.confirmar = '1';
        el.textContent = 'Toca otra vez para borrar todo';
        setTimeout(() => { if (el.isConnected) { delete el.dataset.confirmar; el.textContent = 'Borrar mis datos'; } }, 3000);
    }
  });

  document.addEventListener('change', e => {
    const input = e.target.closest('[data-subir-foto]');
    if (input && input.files && input.files[0]) subirFoto(input.dataset.subirFoto, input.files[0]);
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'form-nombre') return;
    e.preventDefault();
    const n = document.getElementById('input-nombre').value.trim();
    if (!n) return;
    const nuevo = !state.nombre || !state.perfil;
    state.nombre = n.slice(0, 20);
    editandoNombre = false;
    guardar(); document.activeElement?.blur();
    if (nuevo && !state.perfil) return empezarOnboarding();
    render(true);
  });

  // El planeta se mueve un poco con el scroll (efecto profundidad)
  addEventListener('scroll', () => globo('setScroll', scrollY), { passive: true });
  addEventListener('globe-ready', () => actualizarPlaneta(window.__globeMode || 'bienvenida'));

  // Al abrir la app (y al cambiar de día): escudos automáticos
  function alAbrir() {
    const usados = Logic.aplicarEscudos(state);
    if (usados) {
      guardar();
      setTimeout(() => toast(`<img src="${IMG('shield')}" alt="">Tu escudo salvó tu racha`), 1200);
      revisarPremios();
    }
  }
  let dia = Logic.claveFecha();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Logic.claveFecha() !== dia) { dia = Logic.claveFecha(); alAbrir(); render(true); }
  });

  // Modo app instalable (sin internet)
  if ('serviceWorker' in navigator && location.protocol === 'https:' && location.hostname.endsWith('vercel.app')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  }

  // Usuarios que ya tenían nombre pero no han hecho el onboarding lo ven una vez
  if (state.nombre && !state.perfil) onb = { paso: 0, resp: {} };
  // Logros que ya cumplías antes de esta versión: se guardan sin celebración
  if (state.nombre && !Object.keys(state.logros || {}).length) { Logic.revisarLogros(state); guardar(); }
  alAbrir();
  render(true);
})();
