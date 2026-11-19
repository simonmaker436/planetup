// ============================================================
// app.js — Arranque, navegación, hoja de detalle y eventos
// ============================================================

(() => {
  let state = Store.load();
  let tab = 'inicio';
  let filtro = 'todas';
  let editandoNombre = false;

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
    const i = TABS.findIndex(t => t[0] === tab);
    $tabs.style.setProperty('--tab', i);
    $tabs.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
  }

  // ---------- Dibujar ----------
  function brilloDelDia() {
    const hoy = Logic.hechosHoy(state);
    return Logic.retosDelDia().filter(r => hoy.includes(r.id)).length / RETOS_POR_DIA;
  }

  function render(animar = false) {
    const enBienvenida = !state.nombre || editandoNombre;
    document.body.dataset.pantalla = enBienvenida ? 'bienvenida' : tab;
    window.__globeMode = enBienvenida ? 'bienvenida' : tab;
    globo('setMode', window.__globeMode);
    globo('setGlow', brilloDelDia());

    if (enBienvenida) {
      $tabs.hidden = true;
      $main.innerHTML = UI.bienvenida(editandoNombre ? state.nombre : '');
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
  }

  // Deja el hueco justo para que se vea el planeta en Inicio (misma fórmula que globe.js)
  function ajustarEspacio() {
    const el = $main.querySelector('.espacio-planeta');
    if (!el) return;
    const vw = innerWidth, vh = innerHeight;
    const base = Math.min(vw, 560, vh * 0.75);
    const fondoPlaneta = 0.335 * vh + 0.36 * base;
    const arriba = el.getBoundingClientRect().top + scrollY;
    el.style.height = Math.max(120, fondoPlaneta - arriba - 18) + 'px';
    el.style.maxHeight = 'none';
  }
  addEventListener('resize', ajustarEspacio);

  let toastTimer;
  function toast(html) {
    $toast.innerHTML = html;
    $toast.classList.remove('visible'); void $toast.offsetWidth;
    $toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('visible'), 1700);
  }

  // ---------- Hoja de detalle ----------
  function abrirHoja(id) {
    const r = Logic.retoPorId[id];
    $sheet.innerHTML = UI.hoja(r, Logic.hechosHoy(state).includes(id));
    $sheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => $sheet.classList.add('abierta')));
    activarArrastre($sheet.querySelector('.hoja'));
  }
  function cerrarHoja() {
    $sheet.classList.remove('abierta');
    setTimeout(() => { if (!$sheet.classList.contains('abierta')) { $sheet.hidden = true; $sheet.innerHTML = ''; } }, 380);
  }
  // Deslizar hacia abajo para cerrar
  function activarArrastre(el) {
    let y0 = null, dy = 0;
    el.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; el.style.transition = 'none'; }, { passive: true });
    el.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translateY(${dy}px)`; }, { passive: true });
    el.addEventListener('touchend', () => { el.style.transition = ''; el.style.transform = ''; if (dy > 110) cerrarHoja(); y0 = null; });
  }

  // ---------- Celebración de nivel ----------
  function celebrar(nv) {
    $overlay.innerHTML = UI.subioNivel(nv);
    $overlay.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => $overlay.classList.add('abierta')));
    setTimeout(() => FX.lluvia(), 250);
    FX.vibrar([20, 40, 20]);
  }
  function cerrarOverlay() {
    $overlay.classList.remove('abierta');
    setTimeout(() => { $overlay.hidden = true; $overlay.innerHTML = ''; }, 400);
  }

  // ---------- Marcar reto ----------
  function marcarReto(id, x, y, desdeHoja) {
    const nivelAntes = Logic.nivelActual(Logic.puntosTotales(state)).actual.n;
    const yaEstaba = Logic.hechosHoy(state).includes(id);
    Logic.toggleReto(state, id);
    guardar();
    if (desdeHoja) cerrarHoja();
    render(false);

    if (yaEstaba) { FX.vibrar(8); return; }
    // Animación del check recién marcado
    $main.querySelectorAll(`[data-reto="${id}"]`).forEach(b => b.classList.add('pop'));
    FX.estallido(x, y);
    FX.vibrar(15);
    globo('boost');
    toast(`<img src="${IMG(id)}" alt="">+${Logic.retoPorId[id].pts} pts`);

    const nuevo = Logic.nivelActual(Logic.puntosTotales(state)).actual;
    if (nuevo.n > nivelAntes) setTimeout(() => celebrar(nuevo), 500);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', e => {
    if (e.target.closest('[data-cerrar]')) {
      if (e.target.closest('#overlay')) return cerrarOverlay();
      return cerrarHoja();
    }
    const el = e.target.closest('[data-reto],[data-animo],[data-tab],[data-filtro],[data-accion],[data-abrir]');
    if (!el) return;

    if (el.dataset.reto) {
      const r = el.getBoundingClientRect();
      return marcarReto(el.dataset.reto, r.left + r.width / 2, r.top + r.height / 2, 'desdeHoja' in el.dataset);
    }
    if (el.dataset.abrir) return abrirHoja(el.dataset.abrir);
    if (el.dataset.animo) {
      state.animo[Logic.claveFecha()] = Number(el.dataset.animo);
      guardar(); FX.vibrar(10);
      const r = el.getBoundingClientRect();
      FX.estallido(r.left + r.width / 2, r.top + r.height / 2, 14, 5);
      render(false);
      $main.querySelector(`[data-animo="${el.dataset.animo}"]`)?.classList.add('pop');
      return;
    }
    if (el.dataset.tab) {
      if (el.dataset.tab === tab && el.closest('#tabs')) return window.scrollTo({ top: 0, behavior: 'smooth' });
      tab = el.dataset.tab; window.scrollTo(0, 0); FX.vibrar(6); return render(true);
    }
    if (el.dataset.filtro) {
      filtro = el.dataset.filtro; render(false);
      $main.querySelector('.grilla')?.classList.add('animar-grilla');
      return;
    }
    if (el.dataset.accion === 'nombre') { editandoNombre = true; window.scrollTo(0, 0); render(); document.getElementById('input-nombre')?.focus(); return; }
    if (el.dataset.accion === 'reset') {
      // Doble toque para confirmar (sin ventanas emergentes)
      if (el.dataset.confirmar) { state = Store.reset(); tab = 'inicio'; editandoNombre = false; return render(true); }
      el.dataset.confirmar = '1';
      el.textContent = 'Toca otra vez para borrar todo';
      setTimeout(() => { if (el.isConnected) { delete el.dataset.confirmar; el.textContent = 'Borrar mis datos'; } }, 3000);
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'form-nombre') return;
    e.preventDefault();
    const n = document.getElementById('input-nombre').value.trim();
    if (!n) return;
    state.nombre = n.slice(0, 20);
    editandoNombre = false;
    guardar(); document.activeElement?.blur();
    render(true);
  });

  // El planeta se mueve un poco con el scroll (efecto profundidad)
  addEventListener('scroll', () => globo('setScroll', scrollY), { passive: true });
  addEventListener('globe-ready', () => { globo('setMode', window.__globeMode); globo('setGlow', brilloDelDia()); });

  // Si la app queda abierta y cambia el día, refresca los retos
  let dia = Logic.claveFecha();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Logic.claveFecha() !== dia) { dia = Logic.claveFecha(); render(true); }
  });

  // Modo app instalable (sin internet). En la vista previa de Claude no aplica.
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  }

  render(true);
})();
