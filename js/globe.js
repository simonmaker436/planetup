// ============================================================
// globe.js — La Tierra real girando (imágenes de la NASA)
// Día, luces de ciudades de noche, nubes, atmósfera y estrellas.
// La app le habla con: window.PlanetGlobe.setMode('inicio'),
// setGlow(0..1), setHealth(0..1) (salud del planeta según tu nivel),
// setScroll(px), boost() (giro rápido al cumplir un reto) y foto() (para la tarjeta).
// ============================================================

import * as THREE from '../vendor/three.min.js';

const canvas = document.getElementById('space');

// Dónde y de qué tamaño va el planeta en cada pantalla
// cx, cy = posición (0 a 1 de la pantalla) · r = radio (fracción del ancho)
const MODOS = {
  bienvenida: { cx: 0.5,  cy: 0.40, r: 0.44 },
  onboarding: { cx: 0.5,  cy: 0.15, r: 0.22 },
  inicio:     { cx: 0.5,  cy: 0.335, r: 0.36 },
  retos:      { cx: 0.98, cy: 0.02, r: 0.30 },
  liga:       { cx: 0.5,  cy: 1.10, r: 0.75 },
  progreso:   { cx: 0.02, cy: 0.03, r: 0.26 },
};

const SOL = new THREE.Vector3(-1.0, 0.3, 0.42).normalize();
const ROTACION_INICIAL = -0.35; // deja las Américas (Colombia) mirando de frente

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  canvas.classList.add('sin-webgl');
}

if (renderer) iniciar();

function iniciar() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camara.position.set(0, 0, 10);

  const loader = new THREE.TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (url, onLoad) => { const t = loader.load(url, onLoad); t.anisotropy = aniso; return t; };

  // ---------- Estrellas que titilan ----------
  const N = 1800, pos = [], tam = [], fase = [];
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 15;
    const s = Math.sqrt(1 - u * u);
    pos.push(r * s * Math.cos(a), r * u, r * s * Math.sin(a));
    tam.push(Math.random() < 0.06 ? 2.6 + Math.random() * 1.6 : 0.8 + Math.random() * 1.4);
    fase.push(Math.random() * 6.28);
  }
  const geoE = new THREE.BufferGeometry();
  geoE.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geoE.setAttribute('tam', new THREE.Float32BufferAttribute(tam, 1));
  geoE.setAttribute('fase', new THREE.Float32BufferAttribute(fase, 1));
  const uniE = { tiempo: { value: 0 }, dpr: { value: renderer.getPixelRatio() } };
  const estrellas = new THREE.Points(geoE, new THREE.ShaderMaterial({
    uniforms: uniE,
    vertexShader: `attribute float tam; attribute float fase; uniform float tiempo; uniform float dpr; varying float vA;
      void main() {
        vA = 0.55 + 0.45 * sin(tiempo * (0.6 + fase * 0.25) + fase);
        gl_PointSize = tam * dpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  escena.add(estrellas);

  // ---------- Grupo del planeta (se mueve entre pantallas) ----------
  const planeta = new THREE.Group();
  planeta.rotation.z = 0.32; // inclinación de la Tierra
  escena.add(planeta);
  const giro = new THREE.Group();
  giro.rotation.y = ROTACION_INICIAL;
  planeta.add(giro);

  const vertComun = `
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
    void main() {
      vUv = uv;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;

  const uniTierra = {
    dia: { value: tex('img/earth/day.jpg', () => canvas.classList.add('listo')) },
    noche: { value: tex('img/earth/night.jpg') },
    sol: { value: SOL },
    brillo: { value: 0 },
    salud: { value: 1 },
  };
  const tierra = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.ShaderMaterial({
      uniforms: uniTierra,
      vertexShader: vertComun,
      fragmentShader: `
        uniform sampler2D dia; uniform sampler2D noche; uniform vec3 sol; uniform float brillo; uniform float salud;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
        void main() {
          vec3 n = normalize(vNormal);
          float d = dot(n, sol);
          float mezcla = smoothstep(-0.18, 0.28, d);
          vec3 cDia = texture2D(dia, vUv).rgb;
          // Planeta enfermo: tierra seca y café, océanos turbios y una capa de smog
          float gris = dot(cDia, vec3(0.299, 0.587, 0.114));
          vec3 enfermo = mix(vec3(gris), vec3(gris) * vec3(1.08, 0.9, 0.66), 0.7) * 0.95;
          cDia = mix(enfermo, cDia, smoothstep(0.0, 1.0, salud));
          vec3 cNoche = texture2D(noche, vUv).rgb * vec3(1.0, 0.82, 0.55) * 1.6;
          vec3 color = mix(cNoche, cDia * (0.22 + 1.0 * max(d, 0.0)), mezcla);
          float oceano = smoothstep(0.03, 0.18, cDia.b - cDia.r);
          vec3 r = reflect(-sol, n);
          color += pow(max(dot(r, vView), 0.0), 28.0) * oceano * 0.55 * mezcla * vec3(1.0, 0.95, 0.85);
          float fres = pow(1.0 - max(dot(n, vView), 0.0), 2.6);
          color += fres * mix(vec3(0.25, 0.55, 1.0), vec3(0.3, 1.0, 0.6), brillo) * (0.45 + brillo * 0.6) * (0.25 + mezcla);
          color = mix(color, vec3(0.42, 0.38, 0.3) * (0.25 + max(d, 0.0)), (1.0 - salud) * 0.18);
          gl_FragColor = vec4(color, 1.0);
        }`,
    })
  );
  giro.add(tierra);

  // ---------- Nubes ----------
  const nubes = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: { mapa: { value: tex('img/earth/clouds.jpg') }, sol: { value: SOL }, salud: uniTierra.salud },
      vertexShader: vertComun,
      fragmentShader: `
        uniform sampler2D mapa; uniform vec3 sol; uniform float salud;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
        void main() {
          float a = texture2D(mapa, vUv).r;
          float d = dot(normalize(vNormal), sol);
          float luz = 0.08 + 0.95 * smoothstep(-0.1, 0.6, d);
          gl_FragColor = vec4(vec3(luz) * mix(vec3(0.72, 0.66, 0.56), vec3(1.0), salud), a * mix(1.0, 0.85, salud));
        }`,
      transparent: true,
      depthWrite: false,
    })
  );
  giro.add(nubes);

  // ---------- Atmósfera (resplandor) ----------
  const uniAtm = { brillo: uniTierra.brillo, salud: uniTierra.salud };
  const atmosfera = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: uniAtm,
      vertexShader: `varying vec3 vN;
        void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float brillo; uniform float salud; varying vec3 vN;
        void main() {
          // 0 en el borde exterior, 1 pegado a la Tierra: un halo que se desvanece
          float t = clamp(-vN.z / 0.5, 0.0, 1.0);
          float i = pow(t, 3.0);
          vec3 c = mix(mix(vec3(0.62, 0.52, 0.38), vec3(0.3, 0.62, 1.0), salud), vec3(0.3, 1.0, 0.62), brillo * salud);
          gl_FragColor = vec4(c * i * (0.9 + brillo * 1.2), 1.0);
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  planeta.add(atmosfera);

  // ---------- Estado animado ----------
  let modo = window.__globeMode || 'bienvenida';
  let scroll = 0, brilloObjetivo = 0, impulso = 0, saludObjetivo = 1;
  const actual = { x: 0, y: 0, s: 1 };
  let primeraVez = true;

  function objetivo() {
    const m = MODOS[modo] || MODOS.inicio;
    const vw = window.innerWidth, vh = window.innerHeight;
    const H = 2 * Math.tan((camara.fov / 2) * Math.PI / 180) * camara.position.z;
    const W = H * (vw / vh);
    const base = Math.min(vw, 560, vh * 0.75);
    const cy = m.cy - (modo === 'inicio' || modo === 'bienvenida' ? scroll * 0.55 / vh : 0);
    return { x: (m.cx - 0.5) * W, y: (0.5 - cy) * H, s: (m.r * base / vh) * H };
  }

  function ajustar() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  window.addEventListener('resize', ajustar);
  ajustar();

  const reloj = new THREE.Clock();
  let pausado = false;
  document.addEventListener('visibilitychange', () => { pausado = document.hidden; if (!pausado) { reloj.getDelta(); loop(); } });

  function loop() {
    if (pausado) return;
    requestAnimationFrame(loop);
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = objetivo();
    if (primeraVez) { Object.assign(actual, { x: t.x, y: t.y - t.s * 0.4, s: t.s * 0.6 }); primeraVez = false; }
    const k = 1 - Math.pow(0.0025, dt); // suavizado
    actual.x += (t.x - actual.x) * k;
    actual.y += (t.y - actual.y) * k;
    actual.s += (t.s - actual.s) * k;
    planeta.position.set(actual.x, actual.y, 0);
    planeta.scale.setScalar(actual.s);

    impulso *= Math.pow(0.15, dt);
    giro.rotation.y += dt * (0.045 + impulso * 2.2);
    nubes.rotation.y += dt * 0.012;
    estrellas.rotation.y += dt * 0.004;
    uniE.tiempo.value += dt;

    const b = uniTierra.brillo.value + (brilloObjetivo - uniTierra.brillo.value) * k * 0.6;
    uniTierra.brillo.value = b;
    uniTierra.salud.value += (saludObjetivo - uniTierra.salud.value) * Math.min(1, dt * 1.2); // se sana despacio

    renderer.render(escena, camara);
  }
  loop();

  window.PlanetGlobe = {
    setMode(m) { modo = m; },
    setScroll(y) { scroll = y; },
    setGlow(v) { brilloObjetivo = Math.max(0, Math.min(1, v)); },
    boost() { impulso = 1; },
    setHealth(v) { saludObjetivo = Math.max(0, Math.min(1, v)); },
    // Foto del planeta para la tarjeta: devuelve un canvas cuadrado con la Tierra recortada
    foto(tam = 900) {
      renderer.render(escena, camara);
      const c = document.createElement('canvas'); c.width = c.height = tam;
      const vw = window.innerWidth, vh = window.innerHeight, px = renderer.domElement.width / vw;
      const H = 2 * Math.tan((camara.fov / 2) * Math.PI / 180) * camara.position.z;
      const sx = (actual.x / (H * vw / vh) + 0.5) * vw, sy = (0.5 - actual.y / H) * vh, r = (actual.s / H) * vh * 1.22;
      const ctx = c.getContext('2d');
      ctx.drawImage(renderer.domElement, (sx - r) * px, (sy - r) * px, 2 * r * px, 2 * r * px, 0, 0, tam, tam);
      // borde suave: deja solo el planeta y su resplandor
      ctx.globalCompositeOperation = 'destination-in';
      const g = ctx.createRadialGradient(tam / 2, tam / 2, tam * 0.36, tam / 2, tam / 2, tam / 2);
      g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, tam, tam);
      return c;
    },
  };
  window.dispatchEvent(new Event('globe-ready'));
}
