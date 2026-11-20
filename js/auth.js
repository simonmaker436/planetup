// ============================================================
// auth.js — Autenticación con Supabase
// Solo se usa para liga real y modo curso.
// El resto de la app funciona sin cuenta ni conexión.
// ============================================================

const Auth = (() => {
  let _session = null;
  const _listeners = [];

  // ── Inicialización ───────────────────────────────────────
  // Recupera la sesión guardada y escucha cambios futuros.
  // app.js llama init() antes del primer render.
  async function init() {
    const { data: { session } } = await Supa.auth.getSession();
    _session = session;
    Supa.auth.onAuthStateChange((_event, sesion) => {
      _session = sesion;
      _listeners.forEach(fn => fn(sesion));
    });
  }

  function onAuthChange(fn) { _listeners.push(fn); }

  // ── Estado ───────────────────────────────────────────────
  const session = () => _session;
  const user    = () => _session?.user ?? null;
  const uid     = () => _session?.user?.id ?? null;
  const loggedIn = () => !!_session;

  // ── Registro ─────────────────────────────────────────────
  // Retorna:
  //   { confirmacion: true }  → Supabase envió correo de confirmación
  //   { user }                → registro instantáneo (confirmación desactivada)
  //   { error }               → algo falló
  async function registrar(email, password, nombre) {
    const { data, error } = await Supa.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nombre: nombre.trim().slice(0, 20) } },
    });
    if (error) return { error: _trad(error.message) };
    // Sin sesión → Supabase requiere que el usuario confirme el correo
    if (data.user && !data.session) return { confirmacion: true };
    return { user: data.user };
  }

  // ── Login ────────────────────────────────────────────────
  async function entrar(email, password) {
    const { data, error } = await Supa.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: _trad(error.message) };
    return { user: data.user };
  }

  // ── Logout ───────────────────────────────────────────────
  async function salir() {
    await Supa.auth.signOut();
  }

  // ── Errores en español ───────────────────────────────────
  function _trad(msg) {
    if (msg.includes('Email not confirmed'))
      return 'Confirma tu correo antes de entrar — revisa tu bandeja de entrada.';
    if (msg.includes('Invalid login credentials'))
      return 'Correo o contraseña incorrectos.';
    if (msg.includes('User already registered'))
      return 'Ya hay una cuenta con ese correo. Inicia sesión.';
    if (msg.includes('Password should be at least'))
      return 'La contraseña debe tener mínimo 6 caracteres.';
    if (msg.includes('Unable to validate email') || msg.includes('invalid'))
      return 'El correo no parece válido.';
    return msg;
  }

  return { init, session, user, uid, loggedIn, registrar, entrar, salir, onAuthChange };
})();
