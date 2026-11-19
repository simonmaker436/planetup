// ============================================================
// tarjeta.js — Crea la imagen para compartir (formato historia
// de Instagram, 1080x1920) y el recordatorio de calendario.
// ============================================================

const Tarjeta = (() => {
  const cargar = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  function redondo(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function crear(state) {
    const W = 1080, H = 1920, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    try { await document.fonts.load('800 80px Jakarta'); await document.fonts.load('600 40px Jakarta'); } catch (e) {}
    const F = (peso, tam) => `${peso} ${tam}px Jakarta, -apple-system, sans-serif`;

    const pts = Logic.puntosTotales(state), nv = Logic.nivelActual(pts), imp = Logic.impacto(state);
    const racha = Logic.racha(state), salud = Math.round(Logic.saludPlaneta(state) * 100);

    // Fondo espacial
    const g = ctx.createRadialGradient(W / 2, 700, 100, W / 2, 800, 1300);
    g.addColorStop(0, '#0E2A22'); g.addColorStop(0.45, '#060B14'); g.addColorStop(1, '#03050A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      ctx.globalAlpha = 0.2 + Math.random() * 0.7; ctx.fillStyle = '#DDEBFF';
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + 0.4, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Logo
    ctx.textAlign = 'center';
    const gl = ctx.createLinearGradient(0, 110, 0, 190);
    gl.addColorStop(0, '#FFFFFF'); gl.addColorStop(1, '#3DDC84');
    ctx.fillStyle = gl; ctx.font = F(800, 76); ctx.fillText('PlanetUp', W / 2, 180);

    // La Tierra (la misma que se ve en la app)
    const tierra = window.PlanetGlobe ? window.PlanetGlobe.foto(900) : null;
    if (tierra) ctx.drawImage(tierra, W / 2 - 450, 230, 900, 900);
    else { const i = await cargar(IMG('globe')); if (i) ctx.drawImage(i, W / 2 - 300, 380, 600, 600); }

    // Nombre y nivel
    ctx.fillStyle = '#F2F7F4'; ctx.font = F(800, 92); ctx.fillText(state.nombre, W / 2, 1230);
    const imgNivel = await cargar(IMG(nv.actual.img));
    ctx.font = F(700, 44); ctx.fillStyle = '#3DDC84';
    const txtNivel = `Nivel ${nv.actual.n} · ${nv.actual.nombre}`, wt = ctx.measureText(txtNivel).width;
    if (imgNivel) ctx.drawImage(imgNivel, W / 2 - wt / 2 - 76, 1256, 62, 62);
    ctx.fillText(txtNivel, W / 2 + 34, 1302);

    // Tres cifras
    const cifras = [
      ['fire', `${racha}`, racha === 1 ? 'día de racha' : 'días de racha'],
      ['leaf', `${imp.co2.toLocaleString('es-CO', { maximumFractionDigits: 1 })} kg`, 'CO₂ evitado'],
      ['check', `${imp.retos}`, 'retos cumplidos'],
    ];
    for (let i = 0; i < 3; i++) {
      const x = 80 + i * 320, y = 1380, w = 280, h = 290;
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; redondo(ctx, x, y, w, h, 40); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke();
      const ic = await cargar(IMG(cifras[i][0])); if (ic) ctx.drawImage(ic, x + w / 2 - 44, y + 34, 88, 88);
      ctx.fillStyle = '#F2F7F4'; ctx.font = F(800, 58); ctx.fillText(cifras[i][1], x + w / 2, y + 196);
      ctx.fillStyle = 'rgba(226,238,232,0.6)'; ctx.font = F(600, 30); ctx.fillText(cifras[i][2], x + w / 2, y + 245);
    }

    // Salud del planeta
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(226,238,232,0.7)'; ctx.font = F(600, 34);
    ctx.fillText('Salud de mi planeta', 80, 1752);
    ctx.textAlign = 'right'; ctx.fillStyle = '#F2F7F4'; ctx.font = F(800, 34); ctx.fillText(`${salud}%`, W - 80, 1752);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; redondo(ctx, 80, 1776, W - 160, 22, 11); ctx.fill();
    const gb = ctx.createLinearGradient(80, 0, W - 80, 0); gb.addColorStop(0, '#5BF0A0'); gb.addColorStop(1, '#22C1B0');
    ctx.fillStyle = gb; redondo(ctx, 80, 1776, Math.max(22, (W - 160) * salud / 100), 22, 11); ctx.fill();

    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(226,238,232,0.5)'; ctx.font = F(600, 30);
    ctx.fillText('planetup.vercel.app', W / 2, 1870);

    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    return { blob, url: URL.createObjectURL(blob) };
  }

  async function compartir(blob) {
    const archivo = new File([blob], 'mi-planetup.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try { await navigator.share({ files: [archivo], title: 'Mi progreso en PlanetUp' }); return true; } catch (e) { return false; }
    }
    return false;
  }

  const puedeCompartir = () => {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })); } catch (e) { return false; }
  };

  // Recordatorio: abre un archivo de calendario con evento diario + alarma (carpeta recordatorios/)
  function abrirRecordatorio(hora) {
    location.href = `recordatorios/${hora.replace(':', '-')}.ics`;
  }

  return { crear, compartir, puedeCompartir, abrirRecordatorio };
})();
