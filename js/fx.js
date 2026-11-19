// ============================================================
// fx.js — Efectos: confeti de hojas, contadores animados, vibración
// ============================================================

const FX = (() => {
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const COLORES = ['#3DDC84', '#7BF5B0', '#38D6E8', '#5AB8FF', '#FFD45A', '#FFFFFF', '#A48BFF'];
  let particulas = [], corriendo = false, dpr = 1;

  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  }
  addEventListener('resize', ajustar); ajustar();

  function crear(x, y, vx, vy) {
    return {
      x, y, vx, vy,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
      tam: 5 + Math.random() * 7, color: COLORES[(Math.random() * COLORES.length) | 0],
      forma: Math.random() < 0.45 ? 'hoja' : Math.random() < 0.5 ? 'rect' : 'circ',
      vida: 1, osc: Math.random() * 6.28,
    };
  }

  // Explosión desde un punto (al cumplir un reto)
  function estallido(x, y, n = 36, fuerza = 9) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = fuerza * (0.4 + Math.random() * 0.8);
      particulas.push(crear(x, y, Math.cos(a) * v, Math.sin(a) * v - fuerza * 0.6));
    }
    arrancar();
  }

  // Lluvia desde arriba (al subir de nivel)
  function lluvia(n = 140) {
    for (let i = 0; i < n; i++) particulas.push(crear(Math.random() * innerWidth, -20 - Math.random() * innerHeight * 0.6, (Math.random() - 0.5) * 3, 2 + Math.random() * 3));
    arrancar();
  }

  function arrancar() { if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } }

  function paso() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particulas = particulas.filter(p => p.vida > 0 && p.y < innerHeight + 40);
    for (const p of particulas) {
      p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985;
      p.osc += 0.12; p.x += p.vx + Math.sin(p.osc) * 0.6; p.y += p.vy;
      p.rot += p.vr; if (p.vy > 0) p.vida -= 0.006;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.4));
      ctx.fillStyle = p.color;
      const esc = Math.abs(Math.cos(p.osc * 0.7)) * 0.7 + 0.3; // efecto de giro 3D
      ctx.scale(1, esc);
      if (p.forma === 'hoja') { ctx.beginPath(); ctx.ellipse(0, 0, p.tam, p.tam * 0.45, 0, 0, 6.28); ctx.fill(); }
      else if (p.forma === 'rect') ctx.fillRect(-p.tam / 2, -p.tam / 3, p.tam, p.tam * 0.66);
      else { ctx.beginPath(); ctx.arc(0, 0, p.tam * 0.4, 0, 6.28); ctx.fill(); }
      ctx.restore();
    }
    if (particulas.length) requestAnimationFrame(paso);
    else { corriendo = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // Números que suben de 0 al valor final
  function contar(raiz) {
    raiz.querySelectorAll('[data-contar]').forEach(el => {
      const fin = Number(el.dataset.contar), dec = Number(el.dataset.dec || 0);
      if (!fin) return;
      const t0 = performance.now(), dur = 1100;
      const tick = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (fin * e).toLocaleString('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: k < 1 ? 0 : 0 });
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function vibrar(ms = 12) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

  return { estallido, lluvia, contar, vibrar };
})();
