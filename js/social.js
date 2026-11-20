// ============================================================
// social.js — Liga real, amigos y modo curso
// Todas las funciones comprueban Auth.loggedIn() primero;
// si no hay sesión retornan null sin lanzar errores.
// ============================================================

const Social = (() => {

  // ── Helpers internos ─────────────────────────────────────

  // Lunes de la semana actual como YYYY-MM-DD
  function lunesToISO() {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d.toISOString().slice(0, 10);
  }

  // Domingo de la semana que empieza en 'lunes'
  function domingoISO(lunes) {
    const d = new Date(lunes);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }

  // Suma de puntos del estado local entre dos fechas ISO inclusive
  function puntosEnRango(state, desde, hasta) {
    return Object.entries(state.completados)
      .filter(([k]) => k >= desde && k <= hasta)
      .reduce((acc, [, ids]) =>
        acc + ids.reduce((s, id) => s + (Logic.retoPorId[id]?.pts ?? 0), 0), 0);
  }

  // Busca perfiles por array de uuids; devuelve mapa { uid → perfil }
  async function perfilesPorIds(uids) {
    if (!uids.length) return {};
    const { data } = await Supa
      .from('profiles')
      .select('id, nombre, codigo')
      .in('id', uids);
    return Object.fromEntries((data || []).map(p => [p.id, p]));
  }

  // ── Perfil ───────────────────────────────────────────────

  // Devuelve { nombre, codigo } del usuario actual
  async function obtenerPerfil() {
    if (!Auth.loggedIn()) return null;
    const { data } = await Supa
      .from('profiles')
      .select('nombre, codigo')
      .eq('id', Auth.uid())
      .single();
    return data;
  }

  // Mantiene el nombre del perfil en Supabase sincronizado con el local
  async function sincronizarNombre(nombre) {
    if (!Auth.loggedIn() || !nombre) return;
    await Supa
      .from('profiles')
      .update({ nombre: nombre.slice(0, 20), updated_at: new Date().toISOString() })
      .eq('id', Auth.uid());
  }

  // ── Liga ─────────────────────────────────────────────────

  // Sube los puntos de la semana actual; también sincroniza el nombre.
  // Llamar cada vez que el usuario marca un reto (si está logueado).
  async function sincronizarPuntos(state) {
    if (!Auth.loggedIn()) return;
    const semana = lunesToISO();
    const puntos = puntosEnRango(state, semana, domingoISO(semana));
    await Supa
      .from('puntos_semana')
      .upsert({ user_id: Auth.uid(), semana, puntos }, { onConflict: 'user_id,semana' });
    if (state.nombre) sincronizarNombre(state.nombre);
  }

  // Devuelve la lista de la liga: yo + amigos, ordenados por puntos.
  // Usa dos queries para no depender de FK implícitas entre schemas.
  async function obtenerLiga() {
    if (!Auth.loggedIn()) return null;
    const semana = lunesToISO();

    const { data: filas, error } = await Supa
      .from('puntos_semana')
      .select('user_id, puntos')
      .eq('semana', semana);

    if (error || !filas?.length) return null;

    const perfiles = await perfilesPorIds(filas.map(f => f.user_id));

    return filas.map(f => ({
      nombre: perfiles[f.user_id]?.nombre || '?',
      codigo: perfiles[f.user_id]?.codigo || '',
      pts: f.puntos,
      yo: f.user_id === Auth.uid(),
    })).sort((a, b) => b.pts - a.pts);
  }

  // Llama a la función SQL que crea la amistad en ambas direcciones.
  async function agregarAmigo(codigo) {
    if (!Auth.loggedIn()) return { error: 'Debes iniciar sesión primero.' };
    const { data, error } = await Supa.rpc('agregar_amigo', { p_codigo: codigo });
    if (error) return { error: error.message };
    return data; // { id, nombre, codigo } o { error: '...' }
  }

  // ── Modo curso ───────────────────────────────────────────

  // Crea un curso nuevo (el usuario queda como profe)
  async function crearCurso(nombre) {
    if (!Auth.loggedIn()) return { error: 'Debes iniciar sesión primero.' };
    const codigo = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error } = await Supa
      .from('cursos')
      .insert({ nombre: nombre.trim().slice(0, 40), profe_id: Auth.uid(), codigo })
      .select()
      .single();
    if (error) return { error: error.message };
    return { curso: data };
  }

  // Busca un curso por código y une al usuario como alumno
  async function unirseACurso(codigo) {
    if (!Auth.loggedIn()) return { error: 'Debes iniciar sesión primero.' };
    const { data: cursos } = await Supa.rpc('buscar_curso', { p_codigo: codigo });
    if (!cursos?.length) return { error: 'Código de curso no encontrado.' };
    const curso = cursos[0];
    const { error } = await Supa
      .from('curso_miembros')
      .insert({ curso_id: curso.id, user_id: Auth.uid() });
    if (error) {
      if (error.code === '23505') return { error: 'Ya eres miembro de este curso.' };
      return { error: error.message };
    }
    return { curso };
  }

  // Cursos donde el usuario es profe y cursos donde es alumno
  async function obtenerMisCursos() {
    if (!Auth.loggedIn()) return { comoProfe: [], comoAlumno: [] };
    const uid = Auth.uid();

    const [{ data: comoProfe }, { data: membresia }] = await Promise.all([
      Supa.from('cursos').select('id, nombre, codigo').eq('profe_id', uid),
      Supa.from('curso_miembros').select('curso_id').eq('user_id', uid),
    ]);

    let comoAlumno = [];
    if (membresia?.length) {
      const ids = membresia.map(m => m.curso_id);
      const { data } = await Supa
        .from('cursos').select('id, nombre, codigo').in('id', ids);
      comoAlumno = data || [];
    }

    return { comoProfe: comoProfe || [], comoAlumno };
  }

  // Sube el impacto de la semana (CO2, agua, plástico, retos)
  async function sincronizarImpacto(state) {
    if (!Auth.loggedIn()) return;
    const semana = lunesToISO();
    const hasta  = domingoISO(semana);
    let co2 = 0, agua = 0, plastico = 0, retos = 0;
    for (const [k, ids] of Object.entries(state.completados)) {
      if (k < semana || k > hasta) continue;
      for (const id of ids) {
        const r = Logic.retoPorId[id];
        if (!r) continue;
        co2      += r.co2      || 0;
        agua     += r.agua     || 0;
        plastico += r.plastico || 0;
        retos++;
      }
    }
    await Supa
      .from('impacto_semana')
      .upsert(
        { user_id: Auth.uid(), semana, co2, agua, plastico, retos },
        { onConflict: 'user_id,semana' }
      );
  }

  // Vista del profe: impacto de todos los alumnos del curso esta semana.
  // Devuelve { filas: [...], total: { co2, agua, plastico, retos } }
  async function obtenerImpactoCurso(cursoId) {
    if (!Auth.loggedIn()) return null;
    const semana = lunesToISO();

    const { data: miembros, error } = await Supa
      .from('curso_miembros')
      .select('user_id')
      .eq('curso_id', cursoId);

    if (error || !miembros?.length) return null;

    const uids = miembros.map(m => m.user_id);

    // Perfiles e impactos en paralelo
    const [perfiles, { data: impactos }] = await Promise.all([
      perfilesPorIds(uids),
      Supa
        .from('impacto_semana')
        .select('user_id, co2, agua, plastico, retos')
        .eq('semana', semana)
        .in('user_id', uids),
    ]);

    const mapaImpacto = Object.fromEntries(
      (impactos || []).map(i => [i.user_id, i])
    );

    const filas = uids.map(uid => ({
      nombre:   perfiles[uid]?.nombre   || '?',
      codigo:   perfiles[uid]?.codigo   || '',
      yo:       uid === Auth.uid(),
      co2:      mapaImpacto[uid]?.co2      || 0,
      agua:     mapaImpacto[uid]?.agua     || 0,
      plastico: mapaImpacto[uid]?.plastico || 0,
      retos:    mapaImpacto[uid]?.retos    || 0,
    })).sort((a, b) => b.retos - a.retos);

    const total = filas.reduce(
      (acc, f) => ({
        co2:      acc.co2      + f.co2,
        agua:     acc.agua     + f.agua,
        plastico: acc.plastico + f.plastico,
        retos:    acc.retos    + f.retos,
      }),
      { co2: 0, agua: 0, plastico: 0, retos: 0 }
    );

    return { filas, total };
  }

  return {
    obtenerPerfil, sincronizarNombre,
    sincronizarPuntos, obtenerLiga, agregarAmigo,
    crearCurso, unirseACurso, obtenerMisCursos,
    sincronizarImpacto, obtenerImpactoCurso,
  };
})();
