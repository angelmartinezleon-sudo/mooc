const PROMPTS = {
  SOCRATICO: `Eres un formador de docentes experto en pedagogía (Aprendizaje Cooperativo, Cultura de Pensamiento y Mapas Mentales). 
El participante (un docente adulto) acaba de leer la teoría de la sesión y ha escrito su reflexión inicial.
Tu objetivo es generar conflicto cognitivo socrático y evitar la descarga cognitiva:
1. Valida brevemente un punto interesante de su reflexión, pero NO le des la razón sin más ni le redactes conclusiones.
2. Señala un matiz, tensión práctica o posible obstáculo de aula que no haya considerado en relación con el texto teórico.
3. Termina con UNA pregunta socrática incisiva que le obligue a releer o contrastar su idea con los principios teóricos de la sesión.`,

  TAREA: `Eres un mentor pedagógico experto que evalúa borradores de diseño de aula en un MOOC para profesores.
Analiza la propuesta de tarea del participante comparándola con la teoría y la consigna de la sesión:
1. Destaca 1 fortaleza clara de su propuesta.
2. Detecta 1 punto débil, incoherencia metodológica o aspecto superficial (por ejemplo, si en cooperativo no hay interdependencia positiva real, si en cultura de pensamiento la rutina se usa como mero formulario, o si el mapa mental no jerarquiza ideas clave).
3. Propón 1 reto concreto de mejora sin hacerle tú el trabajo, para que él mismo lo reescriba antes de guardarlo.`,

  GUNAWARDENA: `Eres un facilitador experto en Construcción Colectiva del Conocimiento en red según el modelo de Gunawardena et al. (1997).
El participante ha redactado una respuesta o comentario para el muro colectivo (Padlet) respondiendo a otro compañero.
Evalúa en qué fase de Gunawardena se encuentra su comentario:
- Si solo comparte información, da ánimos ("me gusta mucho tu idea", "estoy de acuerdo") o yuxtapone su experiencia (Fase I), indícaselo con amabilidad y pídele que lo reescriba introduciendo una disonancia constructiva (Fase II) o una propuesta de negociación/modificación conjunta (Fase III-IV).
- Si ya explora disonancias o propone construir una idea nueva combinando ambas posturas, felicítale y dale un último matiz para enriquecer el debate en el Padlet.`
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;

  // 1. LECTURA DESDE GOOGLE SHEETS (CATÁLOGO DE SESIONES Y RECUPERACIÓN DE ENTREGAS)
  if (req.method === 'GET') {
    const { accion, id_unico, usuario } = req.query;
    if (!sheetsUrl) return res.status(200).json({ sesiones: [], entrega: null });

    try {
      let targetUrl = `${sheetsUrl}?accion=${encodeURIComponent(accion || 'catalogo')}&t=${Date.now()}`;
      if (id_unico) targetUrl += `&id_unico=${encodeURIComponent(id_unico)}`;
      if (usuario) targetUrl += `&usuario=${encodeURIComponent(usuario)}`;

      const response = await fetch(targetUrl, { redirect: 'follow' });
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        return res.status(200).json(data);
      } catch (e) {
        return res.status(500).json({ error: 'Revisa que el script de Google Sheets esté publicado para "Cualquier persona".' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error de red conectando con Google Sheets' });
    }
  }

  // 2. GUARDADO EN EXCEL Y LLAMADA A GEMINI
  if (req.method === 'POST') {
    const body = req.body || {};
    const { accion } = body;

    if (accion === 'crear_sesion' || accion === 'guardar_entrega') {
      if (accion === 'crear_sesion' && body.pin !== (process.env.PIN_PROFESOR || '1234')) {
        return res.status(401).json({ error: 'PIN de docente incorrecto.' });
      }
      if (!sheetsUrl) {
        return res.status(500).json({ error: 'Falta configurar GOOGLE_SHEETS_URL en Vercel.' });
      }
      try {
        const resp = await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
          redirect: 'follow'
        });
        const text = await resp.text();
        if (text.includes('Exception') || text.includes('Error') || text.includes('<!DOCTYPE html>')) {
          return res.status(500).json({ error: 'Fallo en el Excel (revisa que las pestañas se llamen exactamente Sesiones y Entregas).' });
        }
        return res.status(200).json({ status: 'ok' });
      } catch (err) {
        return res.status(500).json({ error: 'Error conectando con Google Sheets: ' + err.message });
      }
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Falta configurar AI_API_KEY en Vercel' });

    const { fase, textoAlumno, curso, titulo, teoria, consigna } = body;
    const promptBase = PROMPTS[fase] || PROMPTS.SOCRATICO;

    const promptFinal = `${promptBase}

Contexto del MOOC:
- Curso: "${curso || 'Formación Docente'}"
- Sesión: "${titulo || 'Sesión activa'}"
- Base teórica de referencia: "${teoria || ''}"
- Consigna de la actividad: "${consigna || ''}"

Texto escrito por el docente participante:
"${textoAlumno}"

Instrucción de formato: Dirígete al participante de tú, con tono cercano, riguroso y entre iguales (de docente a docente). Sé directo (máximo 130 palabras) y no uses listas interminables.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptFinal }] }] })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return res.status(200).json({ respuesta: data.candidates[0].content.parts[0].text });
      } else {
        return res.status(500).json({ error: data.error?.message || 'Error en la respuesta de Gemini' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Excepción: ' + error.message });
    }
  }
  return res.status(405).end();
}
