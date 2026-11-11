// Vercel Serverless Function: GET /api/config
// Devuelve la configuración pública de Supabase desde las Variables de Entorno de Vercel.
// Mantiene el repositorio 100% libre de claves mientras permite a los alumnos conectarse automáticamente.

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    url: url,
    key: key,
    configured: Boolean(url && key)
  });
};
