// ============================================================
// supabase.js — Cliente de Supabase
// La clave pública (publishable key) es segura para incluir
// aquí: la seguridad real viene del RLS en la base de datos.
// La app funciona completamente offline/sin cuenta; Supa solo
// se activa cuando el usuario entra a liga real o modo curso.
// ============================================================

const SUPA_URL = 'https://rrgolerlxhhayypdbsto.supabase.co';
const SUPA_KEY = 'sb_publishable_h4Ea9FyMSLvRspqfjafyng_hwTBb7N2';

const Supa = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
