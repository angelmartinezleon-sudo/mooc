document.addEventListener('DOMContentLoaded', () => {
  // Catálogo base por defecto (se sustituye automáticamente por las filas de tu Excel en cuanto conecta)
  let CATALOGO = [
    {
      id_unico: 'COOP-S1',
      curso: 'Aprendizaje Cooperativo',
      num_sesion: 'Sesión 1',
      titulo: 'De agrupar alumnos a estructurar la interdependencia positiva',
      teoria: 'Poner a cuatro alumnos alrededor de una mesa no garantiza que cooperen; a menudo genera "viajeros gratuitos" (uno trabaja y tres miran) o reparto fragmentado sin diálogo.\n\nPara que exista auténtico Aprendizaje Cooperativo (Johnson, Johnson y Holubec) necesitamos diseñar tareas donde el éxito de cada miembro esté vinculado al del resto (interdependencia positiva de metas, recursos o roles) y donde exista exigibilidad individual.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Espacio para tu vídeo o infografía embebida</strong> (pega tu código <code>&lt;iframe&gt;</code> en la columna <em>multimedia_html</em> del Excel).</div>',
      consigna_tarea: 'Para la próxima sesión: Toma una actividad grupal que ya suelas hacer en tu asignatura y rediséñala especificando: 1) Qué rol tendrá cada integrante y 2) Qué mecanismo evitará que un solo alumno haga todo el trabajo.',
      reto_gunawardena: 'Lee en el Padlet el rediseño de un compañero/a. No te limites a felicitarle (Fase I): señala un posible riesgo de que algún alumno se escaquee en su diseño (Fase II: disonancia) y proponle un ajuste concreto para blindar la interdependencia positiva (Fase III: co-construcción).',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro Padlet de Aprendizaje Cooperativo</strong> (pega el <code>&lt;iframe&gt;</code> de tu Padlet en la columna <em>padlet_html</em> del Excel).</div>'
    },
    {
      id_unico: 'PENS-S1',
      curso: 'Cultura de Pensamiento',
      num_sesion: 'Sesión 1',
      titulo: 'Hacer visible el pensamiento: más allá de rellenar fichas',
      teoria: 'Las rutinas de pensamiento (Project Zero, Harvard) como "Veo-Pienso-Me pregunto" o "Antes pensaba - Ahora pienso" no son ejercicios burocráticos para rellenar en silencio, sino estructuras breves y repetibles para hacer visible el pensamiento en el aula y construir una cultura donde las ideas se justifican con evidencias.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Recurso multimedia de Cultura de Pensamiento</strong> (configurable desde tu Excel).</div>',
      consigna_tarea: 'Selecciona un contenido clave de tu próxima unidad y diseña cómo aplicarás una rutina de pensamiento indicando qué estímulo presentarás y qué preguntas de andamiaje harás si las respuestas de los alumnos son superficiales.',
      reto_gunawardena: 'Busca en el Padlet la propuesta de otro docente. Identifica una pregunta o paso que pudiera quedarse en un nivel meramente descriptivo (Fase II) y sugiérele una reformulación que exija mayor razonamiento o conexión de evidencias (Fase III).',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro Padlet de Cultura de Pensamiento</strong> (configurable desde tu Excel).</div>'
    },
    {
      id_unico: 'MAPAS-S1',
      curso: 'Mapas Mentales',
      num_sesion: 'Sesión 1',
      titulo: 'Pensamiento irradiante, jerarquía y síntesis visual',
      teoria: 'Un mapa mental (Buzan) no es un esquema de párrafos copiados en cajas. Parte de una imagen o concepto central del que irradian ramas principales (categorías) y subramas mediante palabras clave únicas, conectores visuales, color e iconos que activan la memoria visual y obligan al cerebro a jerarquizar y sintetizar.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Recurso multimedia de Mapas Mentales</strong> (configurable desde tu Excel).</div>',
      consigna_tarea: 'Plantea una actividad donde tu alumnado deba construir un mapa mental sobre un tema curricular: define cuál será el nodo central, cuáles deberían ser las 4-5 ramas matrices y qué criterios usarás para evaluarlo.',
      reto_gunawardena: 'Revisa en el Padlet la estructura de ramas propuesta por un compañero/a. Cuestiona constructivamente si sus ramas fuerzan a sintetizar en palabras clave o si invitan a copiar texto (Fase II) y propón una alternativa visual (Fase III).',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro Padlet de Mapas Mentales</strong> (configurable desde tu Excel).</div>'
    }
  ];

  let sesionActual = CATALOGO[0];
  let consultasIA = 0;
  const MAX_IA = 15;
  let tareaRevisadaIA = false;

  const selectCurso = document.getElementById('select-curso');
  const selectSesion = document.getElementById('select-sesion');
  const inputUsuario = document.getElementById('input-usuario');

  // Clave dinámica por sesión y usuario: ¡así nunca se pierde ni se pisa el progreso entre sesiones!
  function obtenerStorageKey() {
    const user = (inputUsuario.value || 'anonimo').trim().toLowerCase();
    const id = sesionActual ? sesionActual.id_unico : 'default';
    return `mooc_v1_${id}_${user}`;
  }

  // Carga el catálogo desde Google Sheets al abrir la app
  async function inicializarCatalogo() {
    try {
      const res = await fetch('/api/ia?accion=catalogo');
      if (res.ok) {
        const data = await res.json();
        if (data.sesiones && data.sesiones.length > 0) {
          CATALOGO = data.sesiones;
        }
      }
    } catch (e) {}
    poblarSelectCursos();
  }

  function poblarSelectCursos() {
    const cursosUnicos = [...new Set(CATALOGO.map(s => s.curso))];
    selectCurso.innerHTML = cursosUnicos.map(c => `<option value="${c}">${c}</option>`).join('');
    poblarSelectSesiones();
  }

  function poblarSelectSesiones() {
    const cursoElegido = selectCurso.value;
    const sesionesCurso = CATALOGO.filter(s => s.curso === cursoElegido);
    selectSesion.innerHTML = sesionesCurso.map(s => `<option value="${s.id_unico}">${s.num_sesion} · ${s.titulo}</option>`).join('');
    if (sesionesCurso.length > 0) {
      renderizarSesion(sesionesCurso[0]);
    }
  }

  selectCurso.addEventListener('change', poblarSelectSesiones);
  selectSesion.addEventListener('change', () => {
    const encontrada = CATALOGO.find(s => s.id_unico === selectSesion.value);
    if (encontrada) renderizarSesion(encontrada);
  });

  function renderizarSesion(s) {
    sesionActual = s;
    document.getElementById('label-sesion-activa').textContent = `📚 ${s.curso} · ${s.num_sesion}: ${s.titulo}`;
    document.getElementById('vista-titulo').textContent = `${s.num_sesion}: ${s.titulo}`;
    document.getElementById('vista-teoria').innerHTML = s.teoria || '';
    document.getElementById('vista-multimedia').innerHTML = s.multimedia_html || '';
    document.getElementById('vista-consigna-tarea').innerHTML = s.consigna_tarea || '';
    document.getElementById('vista-reto-gunawardena').innerHTML = s.reto_gunawardena || '';
    document.getElementById('vista-padlet').innerHTML = s.padlet_html || '';
    cargarLocal();
    actualizarProgreso();
  }

  // Navegación entre zonas
  function irAZona(idZona) {
    const el = document.getElementById(idZona);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.pill[data-target]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === idZona);
    });
    actualizarProgreso();
  }

  document.querySelectorAll('.pill[data-target]').forEach(btn => {
    btn.addEventListener('click', () => irAZona(btn.dataset.target));
  });

  document.querySelectorAll('button[data-next]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const destino = btn.dataset.next;
      if (destino === 'zona-4' && !tareaRevisadaIA) {
        e.preventDefault();
        const box = document.getElementById('ia-resp-TAREA');
        if (box) {
          box.textContent = '⚠️ Antes de pasar al muro colectivo, pulsa en "Revisar mi tarea con la IA" para recibir feedback sobre tu propuesta.';
          box.classList.add('visible');
        }
        return;
      }
      irAZona(destino);
    });
  });

  document.getElementById('btn-cargar-sesion').addEventListener('click', () => {
    cargarLocal();
    const estado = document.getElementById('estado-conexion');
    if (estado) estado.textContent = `✅ ${sesionActual.id_unico} lista. Tu avance se guardará automáticamente.`;
    irAZona('zona-1');
  });

  // Recuperar desde el Excel de Google Drive si el alumno cambió de ordenador
  document.getElementById('btn-recuperar-nube').addEventListener('click', async () => {
    const usuario = inputUsuario.value.trim();
    const estado = document.getElementById('estado-conexion');
    if (!usuario) {
      alert('Escribe primero tu email o alias en la casilla 3 para buscar tu entrega en la nube.');
      return;
    }
    if (estado) estado.textContent = '⏳ Buscando en la nube...';
    try {
      const res = await fetch(`/api/ia?accion=cargar_entrega&id_unico=${encodeURIComponent(sesionActual.id_unico)}&usuario=${encodeURIComponent(usuario)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.entrega) {
          const e = data.entrega;
          document.getElementById('texto-reflexion').value = e.reflexion || '';
          document.getElementById('texto-verificacion').value = e.verificacion_ia || '';
          document.getElementById('texto-tarea').value = e.propuesta_tarea || '';
          document.getElementById('texto-padlet').value = e.aporte_padlet || '';
          if (e.fb_socratico) mostrarRespuestaIA('SOCRATICO', e.fb_socratico);
          if (e.fb_tarea) { mostrarRespuestaIA('TAREA', e.fb_tarea); tareaRevisadaIA = true; }
          if (e.fb_gunawardena) mostrarRespuestaIA('GUNAWARDENA', e.fb_gunawardena);
          guardarLocal();
          actualizarProgreso();
          if (estado) estado.textContent = '✅ ¡Sesión recuperada desde la nube!';
          return;
        }
      }
      if (estado) estado.textContent = 'ℹ️ No había entregas previas en la nube para este usuario; se mantiene tu borrador local.';
    } catch (err) {
      if (estado) estado.textContent = '⚠️ Modo local activo.';
    }
  });

  function mostrarRespuestaIA(fase, texto) {
    const box = document.getElementById(`ia-resp-${fase}`);
    if (box && texto) {
      box.textContent = texto;
      box.classList.add('visible');
    }
  }

  // Botones de llamada a la IA
  document.querySelectorAll('.btn-ia').forEach(btn => {
    btn.addEventListener('click', async () => {
      const fase = btn.dataset.fase;
      const campo = document.getElementById(btn.dataset.campo);
      const textoAlumno = campo ? campo.value.trim() : '';
      const boxResp = document.getElementById(`ia-resp-${fase}`);

      if (!textoAlumno || textoAlumno.length < 15) {
        if (boxResp) {
          boxResp.textContent = '✍️ Desarrolla un poco más tu idea antes de pedir el feedback de la IA.';
          boxResp.classList.add('visible');
        }
        return;
      }
      if (consultasIA >= MAX_IA) {
        if (boxResp) {
          boxResp.textContent = 'Has alcanzado el límite de 15 consultas de IA en esta sesión.';
          boxResp.classList.add('visible');
        }
        return;
      }

      if (boxResp) {
        boxResp.textContent = '⏳ Analizando tu aportación...';
        boxResp.classList.add('visible');
      }

      try {
        const res = await fetch('/api/ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accion: 'pista',
            fase,
            textoAlumno,
            curso: sesionActual.curso,
            titulo: sesionActual.titulo,
            teoria: sesionActual.teoria,
            consigna: fase === 'TAREA' ? sesionActual.consigna_tarea : sesionActual.reto_gunawardena
          })
        });
        const data = await res.json();
        consultasIA++;
        document.getElementById('contador-ia').textContent = consultasIA;
        if (boxResp) boxResp.textContent = '🤖 ' + (data.respuesta || data.error);
        if (fase === 'TAREA' && !data.error) tareaRevisadaIA = true;
      } catch (e) {
        if (boxResp) boxResp.textContent = '🤖 Error de conexión. Revisa tu red e inténtalo de nuevo.';
      }
      guardarLocal();
      actualizarProgreso();
    });
  });

  // Guardado definitivo en el Excel de Google Drive
  document.getElementById('btn-guardar-nube').addEventListener('click', async () => {
    guardarLocal();
    const msg = document.getElementById('mensaje-entrega');
    if (msg) msg.textContent = '📤 Guardando en el registro del MOOC...';

    const payload = {
      accion: 'guardar_entrega',
      id_unico: sesionActual.id_unico,
      usuario: inputUsuario.value.trim() || 'Anónimo',
      reflexion: document.getElementById('texto-reflexion').value,
      fb_socratico: document.getElementById('ia-resp-SOCRATICO').textContent,
      verificacion_ia: document.getElementById('texto-verificacion').value,
      propuesta_tarea: document.getElementById('texto-tarea').value,
      fb_tarea: document.getElementById('ia-resp-TAREA').textContent,
      aporte_padlet: document.getElementById('texto-padlet').value,
      fb_gunawardena: document.getElementById('ia-resp-GUNAWARDENA').textContent,
      consultas_ia: consultasIA
    };

    try {
      await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (msg) msg.textContent = '✅ ¡Sesión registrada correctamente en el Excel!';
    } catch (e) {
      if (msg) msg.textContent = '✅ Guardado en copia local.';
    }
  });

  document.getElementById('btn-descargar-pdf').addEventListener('click', (e) => {
    e.preventDefault();
    window.print();
  });

  // Panel Admin Docente
  const btnToggle = document.getElementById('btn-toggle-docente');
  const vistaProfe = document.getElementById('vista-profesor');
  const vistaAlumno = document.getElementById('vista-alumno');
  btnToggle.addEventListener('click', () => {
    const oculto = vistaProfe.classList.contains('hidden');
    vistaProfe.classList.toggle('hidden', !oculto);
    vistaAlumno.classList.toggle('hidden', oculto);
    btnToggle.textContent = oculto ? '🎓 Vista MOOC' : '🔒 Admin';
  });

  document.getElementById('btn-crear-sesion').addEventListener('click', async () => {
    const estado = document.getElementById('admin-estado');
    const nueva = {
      accion: 'crear_sesion',
      pin: document.getElementById('admin-pin').value,
      id_unico: document.getElementById('admin-id').value.trim(),
      curso: document.getElementById('admin-curso').value,
      num_sesion: document.getElementById('admin-num').value.trim(),
      titulo: document.getElementById('admin-titulo').value.trim(),
      teoria: document.getElementById('admin-teoria').value.trim(),
      multimedia_html: document.getElementById('admin-multimedia').value.trim(),
      consigna_tarea: document.getElementById('admin-tarea').value.trim(),
      reto_gunawardena: document.getElementById('admin-gunawardena').value.trim(),
      padlet_html: document.getElementById('admin-padlet').value.trim()
    };
    if (estado) estado.textContent = 'Guardando en Google Sheets...';
    const res = await fetch('/api/ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva)
    });
    if (res.ok) {
      CATALOGO.push(nueva);
      poblarSelectCursos();
      if (estado) estado.textContent = `✅ Sesión ${nueva.id_unico} añadida al Excel.`;
    } else {
      if (estado) estado.textContent = '⚠️ Error o PIN incorrecto.';
    }
  });

  function actualizarProgreso() {
    const campos = ['texto-reflexion', 'texto-verificacion', 'texto-tarea', 'texto-padlet'];
    const rellenos = campos.filter(id => document.getElementById(id).value.trim().length > 10).length;
    const pct = Math.min(100, 20 + rellenos * 20);
    const barra = document.getElementById('barra-progreso');
    if (barra) barra.style.width = `${pct}%`;
  }

  function guardarLocal() {
    const datos = {
      consultasIA,
      tareaRevisadaIA,
      reflexion: document.getElementById('texto-reflexion').value,
      verificacion: document.getElementById('texto-verificacion').value,
      tarea: document.getElementById('texto-tarea').value,
      padlet: document.getElementById('texto-padlet').value,
      fb_soc: document.getElementById('ia-resp-SOCRATICO').textContent,
      fb_tar: document.getElementById('ia-resp-TAREA').textContent,
      fb_gun: document.getElementById('ia-resp-GUNAWARDENA').textContent
    };
    localStorage.setItem('mooc_ultimo_usuario', inputUsuario.value);
    localStorage.setItem(obtenerStorageKey(), JSON.stringify(datos));
    actualizarProgreso();
  }

  function cargarLocal() {
    const uGuardado = localStorage.getItem('mooc_ultimo_usuario');
    if (uGuardado && !inputUsuario.value) inputUsuario.value = uGuardado;

    // Limpiar campos antes de cargar la nueva sesión seleccionada
    ['texto-reflexion', 'texto-verificacion', 'texto-tarea', 'texto-padlet'].forEach(id => {
      document.getElementById(id).value = '';
    });
    ['SOCRATICO', 'TAREA', 'GUNAWARDENA'].forEach(f => {
      const b = document.getElementById(`ia-resp-${f}`);
      b.textContent = '';
      b.classList.remove('visible');
    });
    consultasIA = 0;
    tareaRevisadaIA = false;

    const raw = localStorage.getItem(obtenerStorageKey());
    if (raw) {
      try {
        const d = JSON.parse(raw);
        consultasIA = d.consultasIA || 0;
        tareaRevisadaIA = !!d.tareaRevisadaIA;
        document.getElementById('texto-reflexion').value = d.reflexion || '';
        document.getElementById('texto-verificacion').value = d.verificacion || '';
        document.getElementById('texto-tarea').value = d.tarea || '';
        document.getElementById('texto-padlet').value = d.padlet || '';
        if (d.fb_soc) mostrarRespuestaIA('SOCRATICO', d.fb_soc);
        if (d.fb_tar) mostrarRespuestaIA('TAREA', d.fb_tar);
        if (d.fb_gun) mostrarRespuestaIA('GUNAWARDENA', d.fb_gun);
      } catch (e) {}
    }
    document.getElementById('contador-ia').textContent = consultasIA;
  }

  document.querySelectorAll('textarea, input').forEach(el => {
    el.addEventListener('input', guardarLocal);
  });

  inicializarCatalogo();
});