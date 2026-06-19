// api/ask.js
// Función serverless de Vercel. Recibe la pregunta y el contexto desde el
// navegador del usuario, y es ESTA función (no el navegador) la que llama a
// la API de Anthropic usando la clave guardada de forma segura en las
// variables de entorno de Vercel. La clave nunca llega al navegador del
// usuario ni aparece en el código HTML.

export default async function handler(req, res) {
  // Solo aceptar solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta configurar ANTHROPIC_API_KEY en las variables de entorno de Vercel'
    });
  }

  const { system, message, maxTokens } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens || 400,
        system: system || '',
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de la API de Anthropic:', response.status, errText);
      return res.status(response.status).json({ error: 'Error al consultar la IA' });
    }

    const data = await response.json();
    const textBlock = data.content.find(b => b.type === 'text');
    const texto = textBlock ? textBlock.text : 'No se generó respuesta.';
    return res.status(200).json({ text: texto });
  } catch (err) {
    console.error('Error en la función ask:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
