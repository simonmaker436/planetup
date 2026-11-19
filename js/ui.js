// ============================================================
// ui.js — Dibuja cada pantalla (devuelve HTML). Sin emojis:
// imágenes 3D en img/3d/ e íconos SVG propios.
// ============================================================

const UI = (() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, dec = 0) => Number(n).toLocaleString('es-CO', { maximumFractionDigits: dec });
  const plural = (n, uno, varios) => `${fmt(n)} ${n === 1 ? uno : varios}`;
  const img = (id, cls = '') => `<img src="${IMG(id)}" class="${cls}" alt="" decoding="async" draggable="false">`;
  const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // ---------- Íconos SVG ----------
  const ICONOS = {
    inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    retos: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12 3 3 5-6"/>',
    liga: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    progreso: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
    flecha: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chispa: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    camara: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    compartir: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    escudo: '<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icono = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONOS[n]}</svg>`;

  // Cara dibujada para el ánimo (1 = mal, 5 = genial)
  function cara(v, color) {
    const curva = [-5, -2.5, 0, 3, 5.5][v - 1];
    const cejas = v === 1 ? '<path d="M8 8.6l2.3 1M16 8.6l-2.3 1" stroke-width="1.6"/>' : '';
    const ojos = v === 5
      ? '<path d="M7.6 10.6q1.2-1.6 2.4 0M14 10.6q1.2-1.6 2.4 0" stroke-width="1.8"/>'
      : '<circle cx="8.8" cy="10.4" r="1.25" fill="#0A1A12" stroke="none"/><circle cx="15.2" cy="10.4" r="1.25" fill="#0A1A12" stroke="none"/>';
    return `<svg viewBox="0 0 24 24" class="cara" fill="none" stroke="#0A1A12" stroke-linecap="round">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="none"/>
      <circle cx="12" cy="12" r="11" fill="url(#brilloCara)" stroke="none"/>
      ${cejas}${ojos}<path d="M7.5 15.2Q12 ${15.2 + curva} 16.5 15.2" stroke-width="1.8"/></svg>`;
  }

  function anillo(valor, total, tam = 44) {
    const r = tam / 2 - 4, c = 2 * Math.PI * r, p = total ? valor / total : 0;
    return `<svg class="anillo" width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
      <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" class="anillo-fondo"/>
      <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" class="anillo-valor" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" style="--c:${c}"/>
      <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle">${valor}/${total}</text></svg>`;
  }

  // ---------- Tarjeta de reto (lista) ----------
  function tarjetaReto(r, hecho, i = 0) {
    const cat = CATEGORIAS[r.cat];
    return `
      <article class="reto ${hecho ? 'hecho' : ''}" data-abrir="${r.id}" style="--cat:${cat.color};--i:${i}">
        <div class="reto-img">${img(retoImg(r))}</div>
        <div class="reto-info">
          <h4>${esc(r.titulo)}</h4>
          <p><span class="chip-cat">${cat.nombre}</span><span class="pts">+${r.pts} pts</span></p>
        </div>
        <button class="check" data-reto="${r.id}" aria-label="Marcar reto">${icono('check')}</button>
      </article>`;
  }

  // ---------------- BIENVENIDA ----------------
  function bienvenida(nombre = '') {
    return `
      <section class="bienvenida">
        <div class="bienvenida-espacio"></div>
        <div class="bienvenida-contenido">
          <p class="kicker">${icono('chispa')} Retos ecológicos diarios</p>
          <h1 class="logo">PlanetUp</h1>
          <p class="lema">Cada pequeño hábito sube de nivel al planeta. Y a ti.</p>
          <div class="beneficios">
            <span>${img('fire')}Rachas</span>
            <span>${img('crown')}10 niveles</span>
            <span>${img('trophy')}Ligas</span>
          </div>
          <form id="form-nombre">
            <input id="input-nombre" maxlength="20" placeholder="¿Cómo te llamas?" autocomplete="given-name" value="${esc(nombre)}" required>
            <button class="btn-primario" type="submit">Empezar ${icono('flecha')}</button>
          </form>
        </div>
      </section>`;
  }

  const colorSalud = v => v < 34 ? '#E0A35A' : v < 67 ? '#C9E05A' : '#3DDC84';

  // Aviso del recordatorio dentro de la app (si ya pasó tu hora y faltan retos)
  function aviso(state, faltan) {
    if (!state.recordatorio || faltan <= 0) return '';
    const [h, m] = state.recordatorio.split(':').map(Number), ahora = new Date();
    if (ahora.getHours() * 60 + ahora.getMinutes() < h * 60 + m) return '';
    return `<div class="aviso entra">${img('alarma', 'flota')}<p><b>Es tu hora de retos</b><br>Te ${faltan === 1 ? 'falta 1 reto' : `faltan ${faltan} retos`} para completar el día.</p></div>`;
  }

  // ---------------- ONBOARDING (3 preguntas) ----------------
  function onboarding(paso, respuestas, nombre) {
    if (paso >= PREGUNTAS.length) {
      return `<section class="onb onb-fin">
        <div class="onb-espacio"></div>
        <div class="onb-contenido">
          ${img('sparkles', 'onb-img flota')}
          <h2>Listo, ${esc(nombre)}</h2>
          <p class="lema">Armamos tus retos según cómo vives. Tu planeta empieza un poco gris: cada nivel que subas lo va a ir sanando.</p>
          <button class="btn-primario" data-onb="fin">Ver mis retos ${icono('flecha')}</button>
        </div></section>`;
    }
    const p = PREGUNTAS[paso], elegidas = [].concat(respuestas[p.id] || []);
    return `<section class="onb">
      <div class="onb-puntos">${PREGUNTAS.map((_, i) => `<i class="${i <= paso ? 'on' : ''}"></i>`).join('')}</div>
      <div class="onb-contenido" style="--k:${paso}">
        ${img(p.img, 'onb-img flota')}
        <p class="kicker">Pregunta ${paso + 1} de ${PREGUNTAS.length}</p>
        <h2>${p.titulo}</h2>
        ${p.multiple ? '<p class="sub">Puedes elegir varias.</p>' : ''}
        <div class="opciones ${p.multiple ? 'multi' : ''}">
          ${p.opciones.map((o, i) => `<button class="opcion ${elegidas.includes(o.v) ? 'sel' : ''}" data-opcion="${o.v}" style="--i:${i}">${img(o.img)}<span>${o.txt}</span><i>${icono('check')}</i></button>`).join('')}
        </div>
        ${p.multiple ? `<button class="btn-primario" data-onb="siguiente" ${elegidas.length ? '' : 'disabled'}>Continuar ${icono('flecha')}</button>` : ''}
        <button class="btn-peligro saltar" data-onb="saltar">Saltar por ahora</button>
      </div></section>`;
  }

  // ---------------- INICIO ----------------
  function inicio(state) {
    const pts = Logic.puntosTotales(state);
    const nv = Logic.nivelActual(pts);
    const racha = Logic.racha(state);
    const escudos = Logic.escudos(state);
    const salud = Math.round(Logic.saludPlaneta(state) * 100);
    const sem = Logic.semanal(state);
    const hoy = Logic.hechosHoy(state);
    const delDia = Logic.retosDelDia(state);
    const hechosDelDia = delDia.filter(r => hoy.includes(r.id)).length;
    const animoHoy = state.animo[Logic.claveFecha()];
    const sug = Logic.sugerencia(state);
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

    return `
      <header class="top">
        <div>
          <p class="fecha">${fecha}</p>
          <h2>Hola, ${esc(state.nombre)}</h2>
        </div>
        <div class="chips-top">
          ${escudos ? `<div class="escudos" data-accion="info-escudo">${img('shield')}<b>${escudos}</b></div>` : ''}
          <div class="racha ${racha ? 'activa' : ''}">${img('fire')}<b data-contar="${racha}">${racha}</b></div>
        </div>
      </header>
      ${aviso(state, delDia.length - hechosDelDia)}

      <div class="espacio-planeta">
        <div class="salud" data-tab="progreso">
          <span class="salud-txt"><span class="punto" style="--sc:${colorSalud(salud)}"></span>Salud del planeta <b>${salud}%</b></span>
          <span class="salud-barra"><i style="--p:${Math.max(4, salud)}%;--sc:${colorSalud(salud)}"></i></span>
        </div>
      </div>

      <section class="card nivel-card entra" data-tab="progreso" style="--i:0">
        <div class="nivel-img">${img(nv.actual.img, 'flota')}</div>
        <div class="nivel-texto">
          <p class="mini">Nivel ${nv.actual.n} de 10</p>
          <h3>${nv.actual.nombre}</h3>
          <div class="barra"><div class="barra-relleno" style="--p:${Math.max(3, nv.progreso * 100)}%"></div></div>
          <p class="mini">${nv.sig ? `<b data-contar="${pts}">${fmt(pts)}</b> / ${fmt(nv.sig.min)} pts · siguiente: ${nv.sig.nombre}` : `<b>${fmt(pts)}</b> pts · nivel máximo alcanzado`}</p>
        </div>
      </section>

      <section class="card semana entra" style="--i:1">
        ${Logic.semana(state).map(d => `
          <div class="dia ${d.retos ? 'lleno' : ''} ${d.completo ? 'completo-dia' : ''} ${d.escudo ? 'protegido' : ''} ${d.hoy ? 'hoy' : ''} ${d.futuro ? 'futuro' : ''}">
            <span>${DIAS[(d.d.getDay() + 6) % 7]}</span>
            <i>${d.escudo ? img('shield') : d.retos ? icono('check') : d.d.getDate()}</i>
          </div>`).join('')}
      </section>

      <section class="card semanal entra ${sem.completo ? 'ganado' : ''}" style="--i:2">
        <div class="semanal-top">
          <div class="semanal-img">${img(sem.reto.img, 'flota')}</div>
          <div>
            <p class="kicker">Reto de la semana · ${sem.completo ? 'completado' : `quedan ${plural(sem.diasRestantes, 'día', 'días')}`}</p>
            <h3>${sem.reto.titulo}</h3>
            <p class="mini">${sem.reto.desc}</p>
          </div>
        </div>
        <div class="semanal-prog">
          <div class="barra"><div class="barra-relleno" style="--p:${Math.max(3, sem.progreso / sem.reto.meta * 100)}%"></div></div>
          <b>${sem.progreso}/${sem.reto.meta}</b><span class="pill">+${sem.reto.pts} pts</span>
        </div>
      </section>

      <section class="card entra" style="--i:3">
        <h3>¿Cómo te sientes hoy?</h3>
        <div class="animos">
          ${ANIMOS.map(a => `<button class="animo ${animoHoy === a.v ? 'sel' : ''}" data-animo="${a.v}">${cara(a.v, a.color)}<span>${a.nombre}</span></button>`).join('')}
        </div>
      </section>

      <section class="entra" style="--i:4">
        <div class="titulo-seccion">
          <div><h3>Retos de hoy</h3><p class="mini">${state.perfil ? 'Elegidos para ti · cambian a medianoche' : 'Cambian cada día a medianoche'}</p></div>
          ${anillo(hechosDelDia, delDia.length)}
        </div>
        <div class="lista">${delDia.map((r, i) => tarjetaReto(r, hoy.includes(r.id), i)).join('')}</div>
        ${hechosDelDia === delDia.length ? `<div class="completo">${img('sparkles')}<p><b>¡Día completo!</b><br>Ganaste un escudo que protege tu racha si un día se te olvida.</p></div>` : `<p class="mini centro">Completa los 5 y ganas un ${img('shield', 'inline')} escudo para tu racha</p>`}
      </section>

      ${sug ? `
      <section class="card sugerencia entra" style="--i:5">
        <div class="sug-top">${img('sparkles')}<div><h3>Sugerencia para ti</h3><p class="mini">${sug.motivo}</p></div></div>
        <div class="lista">${tarjetaReto(sug.reto, false)}</div>
      </section>` : ''}
    `;
  }

  // ---------------- RETOS ----------------
  function retos(state, filtro) {
    const hoy = Logic.hechosHoy(state);
    const lista = filtro === 'todas' ? RETOS : RETOS.filter(r => r.cat === filtro);
    return `
      <header class="encabezado">
        <p class="kicker">Hoy llevas ${plural(hoy.length, 'reto', 'retos')}</p>
        <h2 class="titulo-pagina">Retos</h2>
        <p class="sub">${RETOS.length} formas de cuidar el planeta. Cada uno se puede cumplir una vez al día.</p>
      </header>
      <div class="filtros">
        <button class="filtro ${filtro === 'todas' ? 'sel' : ''}" data-filtro="todas">${img('globe')}Todos</button>
        ${Object.entries(CATEGORIAS).map(([k, c]) => `<button class="filtro ${filtro === k ? 'sel' : ''}" data-filtro="${k}" style="--cat:${c.color}">${img(c.img)}${c.nombre}</button>`).join('')}
      </div>
      <div class="grilla">
        ${lista.map((r, i) => {
          const hecho = hoy.includes(r.id), cat = CATEGORIAS[r.cat];
          return `<article class="tile ${hecho ? 'hecho' : ''}" data-abrir="${r.id}" style="--cat:${cat.color};--i:${i}">
            <button class="check" data-reto="${r.id}" aria-label="Marcar reto">${icono('check')}</button>
            <div class="tile-img">${img(retoImg(r))}</div>
            <h4>${esc(r.titulo)}</h4>
            <p><span class="chip-cat">${cat.nombre}</span><span class="pts">+${r.pts}</span></p>
          </article>`;
        }).join('')}
      </div>`;
  }

  // ---------------- LIGA ----------------
  function liga(state) {
    const filas = Logic.liga(state);
    const podio = [filas[1], filas[0], filas[2]];
    const alturas = [0.72, 1, 0.55], medallas = ['medal2', 'medal1', 'medal3'];
    const miPos = filas.findIndex(f => f.yo) + 1;
    const avatar = (f, cls = '') => `<span class="avatar ${cls}" style="--h:${(f.nombre.charCodeAt(0) * 37) % 360}">${esc(f.nombre[0] || '?').toUpperCase()}</span>`;
    return `
      <header class="encabezado liga-top">
        <div>
          <p class="kicker">${icono('reloj')} Termina en ${Logic.finDeLiga()}</p>
          <h2 class="titulo-pagina">Liga semanal</h2>
          <p class="sub">Vas en el puesto <b>${miPos}</b> de ${filas.length}. Los puntos se reinician cada lunes.</p>
        </div>
        ${img('trophy', 'trofeo flota')}
      </header>

      <section class="podio">
        ${podio.map((f, i) => `
          <div class="podio-col ${f.yo ? 'yo' : ''}" style="--h:${alturas[i]};--i:${i}">
            ${img(medallas[i], 'medalla')}
            ${avatar(f, 'grande')}
            <b>${esc(f.nombre)}</b>
            <span class="pts-podio">${fmt(f.pts)} pts</span>
            <div class="podio-barra"><span>${[2, 1, 3][i]}</span></div>
          </div>`).join('')}
      </section>

      <div class="liga">
        ${filas.slice(3).map((f, i) => `
          <div class="fila-liga ${f.yo ? 'yo' : ''}" style="--i:${i}">
            <span class="pos">${i + 4}</span>
            ${avatar(f)}
            <span class="nombre">${esc(f.nombre)}${f.yo ? ' (tú)' : ''}</span>
            <span class="pts">${fmt(f.pts)} pts</span>
          </div>`).join('')}
      </div>
      <p class="nota">Versión de prueba: los amigos son de demostración. En la versión final se conectarían amigos y cursos reales.</p>`;
  }

  // ---------------- PROGRESO ----------------
  function progreso(state) {
    const pts = Logic.puntosTotales(state);
    const nv = Logic.nivelActual(pts);
    const imp = Logic.impacto(state);
    const dias = Logic.ultimos7(state);
    const maxRetos = Math.max(1, ...dias.map(d => d.retos));
    const cmp = Logic.animoConVsSin(state);
    const nombreDia = d => d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '').slice(0, 3);
    const animoDe = v => ANIMOS.find(a => a.v === Math.round(v));

    return `
      <header class="encabezado fila-encabezado">
        <div>
          <p class="kicker">${plural(imp.retos, 'reto cumplido', 'retos cumplidos')}</p>
          <h2 class="titulo-pagina">Tu impacto</h2>
        </div>
        <button class="btn-icono" data-accion="compartir" aria-label="Compartir">${icono('compartir')}</button>
      </header>

      <section class="impacto-hero card">
        ${img('leaf', 'flota')}
        <div>
          <p class="mini">CO₂ que dejaste de emitir</p>
          <p class="cifra"><b data-contar="${imp.co2}" data-dec="1">${fmt(imp.co2, 1)}</b> kg</p>
          <p class="mini">Lo que absorbe un árbol en ${plural(Math.round(imp.co2 / 0.06), 'día', 'días')}</p>
        </div>
      </section>

      <div class="stats">
        <div class="stat" style="--i:0">${img('droplet')}<b data-contar="${imp.agua}">${fmt(imp.agua)}</b><span>litros de agua</span></div>
        <div class="stat" style="--i:1">${img('termo')}<b data-contar="${imp.plastico}">${fmt(imp.plastico)}</b><span>gramos de plástico</span></div>
        <div class="stat" style="--i:2">${img('check')}<b data-contar="${pts}">${fmt(pts)}</b><span>puntos totales</span></div>
      </div>
      <p class="nota">Valores aproximados. ${plural(Math.round(imp.plastico / 20), 'botella plástica evitada', 'botellas plásticas evitadas')}.</p>

      <section class="card">
        <div class="titulo-seccion"><h3>Retos y ánimo</h3><span class="mini">Últimos 7 días</span></div>
        <div class="grafica">
          ${dias.map((d, i) => {
            const a = d.animo ? animoDe(d.animo) : null;
            return `<div class="col" style="--i:${i}">
              <span class="col-animo">${a ? cara(a.v, a.color) : '<i class="vacio"></i>'}</span>
              <div class="col-barra"><div style="--h:${(d.retos / maxRetos) * 100}%"></div></div>
              <span class="col-num">${d.retos}</span>
              <span class="col-dia">${nombreDia(d.d)}</span>
            </div>`;
          }).join('')}
        </div>
        ${cmp.con && cmp.sin
          ? `<p class="sub">Los días con retos tu ánimo promedio es <b>${fmt(cmp.con, 1)}</b> y sin retos es <b>${fmt(cmp.sin, 1)}</b> (de 5).</p>`
          : `<p class="sub">Registra tu ánimo varios días para ver cómo los retos influyen en cómo te sientes.</p>`}
      </section>

      <section>
        <div class="titulo-seccion"><h3>Camino de niveles</h3><span class="mini">${fmt(pts)} pts</span></div>
        <div class="camino">
          ${NIVELES.map((n, i) => {
            const estado = n.n < nv.actual.n ? 'pasado' : n.n === nv.actual.n ? 'actual' : 'bloqueado';
            return `<div class="paso ${estado}" style="--i:${i}">
              <div class="paso-img">${img(n.img)}</div>
              <div class="paso-info"><b>${n.nombre}</b><span>Nivel ${n.n} · ${fmt(n.min)} pts</span></div>
              ${estado === 'actual' ? '<span class="pill">Estás aquí</span>' : estado === 'pasado' ? `<span class="ok">${icono('check')}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </section>

      <section>
        <div class="titulo-seccion"><h3>Logros</h3><span class="mini">${Object.keys(state.logros || {}).length} de ${LOGROS.length}</span></div>
        <div class="logros">
          ${LOGROS.map((l, i) => {
            const ok = state.logros && state.logros[l.id];
            return `<button class="logro ${ok ? 'ganado' : ''}" data-logro="${l.id}" style="--i:${i}">${img(l.img)}<b>${l.nombre}</b></button>`;
          }).join('')}
        </div>
      </section>

      <section>
        <div class="titulo-seccion"><h3>Fotos de tus retos</h3><span class="mini">${plural((state.fotos || []).length, 'foto', 'fotos')}</span></div>
        ${(state.fotos || []).length ? `<div class="galeria">
          ${[...state.fotos].reverse().map(k => {
            const [f, id] = k.split('|'), r = Logic.retoPorId[id];
            return `<figure data-ver-foto="${k}"><img data-foto="${k}" alt=""><figcaption>${r ? esc(r.titulo) : ''}<span>${new Date(f + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span></figcaption></figure>`;
          }).join('')}
        </div>` : `<div class="vacio-card">${img('camara')}<p class="sub">Cuando cumplas un reto, ábrelo y toca <b>Agregar foto de prueba</b>. Aquí se arma tu galería.</p></div>`}
      </section>

      <section class="card fila-ajuste" data-accion="recordatorio">
        ${img('alarma')}
        <div><h3>Recordatorio diario</h3><p class="mini">${state.recordatorio ? `Todos los días a las ${hora12(state.recordatorio)}` : 'Elige una hora para acordarte de tus retos'}</p></div>
        ${icono('flecha')}
      </section>

      <section class="ajustes">
        <button class="btn-secundario" data-accion="perfil">Volver a personalizar mis retos</button>
        <button class="btn-secundario" data-accion="nombre">Cambiar nombre</button>
        <button class="btn-peligro" data-accion="reset">Borrar mis datos</button>
      </section>`;
  }

  const hora12 = h => { const [a, b] = h.split(':').map(Number); return `${(a % 12) || 12}:${String(b).padStart(2, '0')} ${a < 12 ? 'a. m.' : 'p. m.'}`; };

  // ---------------- HOJA DE DETALLE DEL RETO ----------------
  function hoja(r, hecho, claveFoto) {
    const cat = CATEGORIAS[r.cat];
    const chips = [
      r.co2 ? `<span><b>${fmt(r.co2, 2)} kg</b>CO₂</span>` : '',
      r.agua ? `<span><b>${fmt(r.agua)} L</b>agua</span>` : '',
      r.plastico ? `<span><b>${fmt(r.plastico)} g</b>plástico</span>` : '',
      `<span><b>+${r.pts}</b>puntos</span>`,
    ].join('');
    return `
      <div class="hoja-fondo" data-cerrar></div>
      <div class="hoja" style="--cat:${cat.color}">
        <div class="agarre"></div>
        <div class="hoja-img">${img(retoImg(r), 'flota')}</div>
        <span class="chip-cat">${cat.nombre}</span>
        <h3>${esc(r.titulo)}</h3>
        <p class="hoja-info">${esc(r.info)}</p>
        <div class="impacto-chips">${chips}</div>
        ${claveFoto ? `<div class="foto-prueba"><img data-foto="${claveFoto}" alt=""><span>${icono('check')} Foto de prueba</span></div>` : ''}
        <label class="btn-secundario btn-foto">
          ${icono('camara')} ${claveFoto ? 'Cambiar foto' : hecho ? 'Agregar foto de prueba' : 'Lo hice con foto'}
          <input type="file" accept="image/*" capture="environment" data-subir-foto="${r.id}" hidden>
        </label>
        <button class="btn-primario ${hecho ? 'listo' : ''}" data-reto="${r.id}" data-desde-hoja>
          ${hecho ? `${icono('check')} Hecho hoy · tocar para desmarcar` : `¡Lo hice! ${icono('check')}`}
        </button>
      </div>`;
  }

  // ---------------- CELEBRACIÓN DE NIVEL ----------------
  function subioNivel(nv) {
    return `
      <div class="celebra">
        <div class="rayos"></div>
        ${img(nv.img, 'celebra-img')}
        <p class="kicker">¡Subiste de nivel!</p>
        <h2>Nivel ${nv.n}</h2>
        <h3>${nv.nombre}</h3>
        <button class="btn-primario" data-cerrar>Continuar ${icono('flecha')}</button>
      </div>`;
  }

  // ---------------- LOGRO DESBLOQUEADO ----------------
  function logroNuevo(l) {
    return `
      <div class="celebra">
        <div class="rayos dorados"></div>
        ${img(l.img, 'celebra-img')}
        <p class="kicker">¡Logro desbloqueado!</p>
        <h2 class="logro-nombre">${l.nombre}</h2>
        <h3>${l.desc}</h3>
        <button class="btn-primario" data-cerrar>Genial ${icono('flecha')}</button>
      </div>`;
  }

  // Detalle de un logro (bloqueado o no)
  function logroInfo(l, fecha) {
    return `
      <div class="hoja-fondo" data-cerrar></div>
      <div class="hoja" style="--cat:${fecha ? '#FFC845' : '#6B7A71'}">
        <div class="agarre"></div>
        <div class="hoja-img ${fecha ? '' : 'bloqueada'}">${img(l.img, 'flota')}</div>
        <span class="chip-cat">${fecha ? `Desbloqueado el ${new Date(fecha + 'T12:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}` : 'Bloqueado'}</span>
        <h3>${l.nombre}</h3>
        <p class="hoja-info">${l.desc}</p>
        <button class="btn-secundario ancho" data-cerrar>Cerrar</button>
      </div>`;
  }

  function infoEscudo(n) {
    return `
      <div class="hoja-fondo" data-cerrar></div>
      <div class="hoja" style="--cat:#5AB8FF">
        <div class="agarre"></div>
        <div class="hoja-img">${img('shield', 'flota')}</div>
        <span class="chip-cat">Tienes ${plural(n, 'escudo', 'escudos')} · máximo ${MAX_ESCUDOS}</span>
        <h3>Escudo de racha</h3>
        <p class="hoja-info">Cada vez que completas los 5 retos del día ganas un escudo. Si un día se te olvida, el escudo se usa solo y tu racha no se pierde.</p>
        <button class="btn-secundario ancho" data-cerrar>Entendido</button>
      </div>`;
  }

  // Elegir la hora del recordatorio
  function recordatorio(hora) {
    return `
      <div class="hoja-fondo" data-cerrar></div>
      <div class="hoja" style="--cat:#FFC845">
        <div class="agarre"></div>
        <div class="hoja-img">${img('alarma', 'flota')}</div>
        <h3>Recordatorio diario</h3>
        <p class="hoja-info">Elige la hora. Se agrega como evento diario con alarma en el calendario de tu celular, y la app también te avisa al abrirla.</p>
        <input type="time" id="hora-recordatorio" class="input-hora" value="${hora || '19:00'}">
        <button class="btn-primario" data-accion="guardar-recordatorio">${icono('campana')} Agregar a mi calendario</button>
        ${hora ? '<button class="btn-peligro" data-accion="quitar-recordatorio">Quitar recordatorio</button>' : ''}
      </div>`;
  }

  // Vista de la tarjeta para compartir
  function compartir(url, puedeCompartir) {
    return `
      <div class="compartir">
        <button class="btn-icono cerrar" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button>
        <img src="${url}" class="tarjeta-img" alt="Mi progreso en PlanetUp">
        ${puedeCompartir
          ? `<button class="btn-primario" data-accion="compartir-ya">${icono('compartir')} Compartir</button>`
          : `<p class="mini centro">Mantén presionada la imagen para guardarla o compartirla.</p>`}
      </div>`;
  }

  function verFoto(clave, r) {
    return `
      <div class="compartir">
        <button class="btn-icono cerrar" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button>
        <img data-foto="${clave}" class="tarjeta-img foto-grande" alt="">
        <p class="sub centro">${r ? esc(r.titulo) : ''}</p>
        <button class="btn-peligro" data-borrar-foto="${clave}">Borrar foto</button>
      </div>`;
  }

  return { bienvenida, onboarding, inicio, retos, liga, progreso, hoja, subioNivel, logroNuevo, logroInfo, infoEscudo, recordatorio, compartir, verFoto, icono };
})();
