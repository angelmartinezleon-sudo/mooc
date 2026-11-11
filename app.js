document.addEventListener('DOMContentLoaded', () => {
  let CATALOGO = [
    {
      id_unico: 'COOP-S1',
      curso: 'Aprendizaje Cooperativo',
      num_sesion: 'Sesión 1',
      titulo: 'De agrupar alumnos a estructurar la interdependencia positiva',
      teoria: 'Poner a cuatro alumnos alrededor de una mesa no garantiza que cooperen; a menudo genera "viajeros gratuitos" (uno trabaja y tres miran) o reparto fragmentado sin diálogo.\n\nPara que exista auténtico Aprendizaje Cooperativo (Johnson, Johnson y Holubec) necesitamos diseñar tareas donde el éxito de cada miembro esté vinculado al del resto (interdependencia positiva de metas, recursos o roles) y donde exista exigibilidad individual.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Espacio para tu recurso multimedia</strong> (pega tu código de imagen <code>&lt;img src="/imagenes/..."&gt;</code> o <code>&lt;iframe&gt;</code> en la columna <em>multimedia_html</em> de la base de datos).</div>',
      consigna_tarea: 'Toma una actividad grupal que ya suelas hacer en tu asignatura y rediséñala especificando: 1) Qué rol tendrá cada integrante y 2) Qué mecanismo evitará que un solo alumno haga todo el trabajo.',
      reto_gunawardena: 'Lee en el muro el rediseño de un compañero/a. No te limites a felicitarle: señala un posible riesgo de que algún alumno se escaquee en su diseño y proponle un ajuste concreto para blindar la interdependencia positiva.',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro de Aprendizaje Cooperativo</strong> (pega el código de tu herramienta colaborativa en la columna <em>padlet_html</em> de la base de datos).</div>'
    },
    {
      id_unico: 'PENS-S1',
      curso: 'Cultura de Pensamiento',
      num_sesion: 'Sesión 1',
      titulo: 'Hacer visible el pensamiento: más allá de rellenar fichas',
      teoria: 'Las rutinas de pensamiento (Project Zero, Harvard) como "Veo-Pienso-Me pregunto" o "Antes pensaba - Ahora pienso" no son ejercicios burocráticos para rellenar en silencio, sino estructuras breves y repetibles para hacer visible el pensamiento en el aula y construir una cultura donde las ideas se justifican con evidencias.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Recurso multimedia de Cultura de Pensamiento</strong> (configurable desde la base de datos).</div>',
      consigna_tarea: 'Selecciona un contenido clave de tu próxima unidad y diseña cómo aplicarás una rutina de pensamiento indicando qué estímulo presentarás y qué preguntas de andamiaje harás si las respuestas de los alumnos son superficiales.',
      reto_gunawardena: 'Busca en el muro la propuesta de otro docente. Identifica una pregunta o paso que pudiera quedarse en un nivel meramente descriptivo y sugiérele una reformulación que exija mayor razonamiento o conexión de evidencias.',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro de Cultura de Pensamiento</strong> (configurable desde la base de datos).</div>'
    },
    {
      id_unico: 'MAPAS-S1',
      curso: 'Mapas Mentales',
      num_sesion: 'Sesión 1',
      titulo: 'Pensamiento irradiante, jerarquía y síntesis visual',
      teoria: 'Un mapa mental (Buzan) no es un esquema de párrafos copiados en cajas. Parte de una imagen o concepto central del que irradian ramas principales (categorías) y subramas mediante palabras clave únicas, conectores visuales, color e iconos que activan la memoria visual y obligan al cerebro a jerarquizar y sintetizar.',
      multimedia_html: '<div style="padding:20px; background:#eff6ff; border-radius:8px;">🎥 <strong>Recurso multimedia de Mapas Mentales</strong> (configurable desde la base de datos).</div>',
      consigna_tarea: 'Plantea una actividad donde tu alumnado deba construir un mapa mental sobre un tema curricular: define cuál será el nodo central, cuáles deberían ser las 4-5 ramas matrices y qué criterios usarás para evaluarlo.',
      reto_gunawardena: 'Revisa en el muro la estructura de ramas propuesta por un compañero/a. Cuestiona constructivamente si sus ramas fuerzan a sintetizar en palabras clave o si invitan a copiar texto y propón una alternativa visual.',
      padlet_html: '<div style="padding:24px; background:#f5f3ff; border-radius:8px;">📌 <strong>Muro de Mapas Mentales</strong> (configurable desde la base de datos).</div>'
    }
  ];

  let sesionActual = CATALOGO[0];
  let sesionesFiltradas = [];
  let consultasIA = 0;
  const MAX_IA = 15;
  let tareaRevisadaIA = false;

  const selectCurso = document.getElementById('select-curso');
  const selectSesion = document.getElementById('select-sesion');
  const inputUsuario = document.getElementById('input-usuario');
  const inputClave = document.getElementById('input-clave');

  // Evitamos que el navegador autocompleta la contraseña al abrir la página
  if (inputClave) inputClave.value = '';

  function sincronizarCajasTexto() {
    ['texto-reflexion', 'texto-verificacion', 'texto-tarea', 'texto-padlet'].forEach(id => {
      const ta = document.getElementById(id);
      const mirror = document.getElementById(`mirror-${id}`);
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = Math.max(110, ta.scrollHeight) + 'px';
        if (mirror) {
          mirror.textContent = ta.value.trim() || '(Sin respuesta registrada)';
        }
      }
    });
  }

  function obtenerStorageKey() {
    const user = (inputUsuario?.value || 'anonimo').trim().toLowerCase();
    const id = sesionActual ? sesionActual.id_unico : 'default';
    return `mooc_v3_${id}_${user}`;
  }

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
    const cursosPorDefecto = ['Aprendizaje Cooperativo', 'Cultura de Pensamiento', 'Mapas Mentales'];
    const cursosCatalogo = CATALOGO.map(s => s.curso).filter(Boolean);
    const cursosUnicos = [...new Set([...cursosCatalogo, ...cursosPorDefecto])];
    selectCurso.innerHTML = cursosUnicos.map(c => `<option value="${c}">${c}</option>`).join('');
    poblarSelectSesiones();
  }

  function poblarSelectSesiones() {
    const cursoElegido = selectCurso.value;
    sesionesFiltradas = CATALOGO.filter(s => s.curso === cursoElegido);
    selectSesion.innerHTML = sesionesFiltradas.map((s, idx) => `<option value="${idx}">${s.num_sesion} · ${s.titulo}</option>`).join('');
    if (sesionesFiltradas.length > 0) {
      renderizarSesion(sesionesFiltradas[0]);
    }
  }

  selectCurso.addEventListener('change', poblarSelectSesiones);

  selectSesion.addEventListener('change', () => {
    const idx = parseInt(selectSesion.value, 10);
    if (sesionesFiltradas[idx]) {
      renderizarSesion(sesionesFiltradas[idx]);
    }
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
    const idx = parseInt(selectSesion.value, 10);
    if (sesionesFiltradas[idx]) {
      renderizarSesion(sesionesFiltradas[idx]);
    }
    const estado = document.getElementById('estado-conexion');
    if (estado) estado.textContent = `✅ ${sesionActual.titulo} cargada.`;
    irAZona('zona-1');
  });

  document.getElementById('btn-recuperar-nube').addEventListener('click', async () => {
    let usuario = inputUsuario.value.trim().toLowerCase();
    let clave = inputClave ? inputClave.value.trim() : '';
    const estado = document.getElementById('estado-conexion');

    if (!usuario) {
      const uPedido = prompt('📧 Escribe tu Email o Alias para buscar tu entrega:');
      if (!uPedido || !uPedido.trim()) return;
      usuario = uPedido.trim().toLowerCase();
      inputUsuario.value = usuario;
    }

    if (!clave) {
      const cPedida = prompt('🔑 Escribe la contraseña o PIN personal con la que guardaste tu sesión:');
      if (!cPedida || !cPedida.trim()) {
        alert('⚠️ Es necesario introducir tu contraseña para recuperar la entrega de la nube.');
        return;
      }
      clave = cPedida.trim();
      if (inputClave) inputClave.value = clave;
    }

    if (estado) estado.textContent = '⏳ Verificando credenciales y buscando en la nube...';
    try {
      const credencial = `${usuario}::${clave}`;
      const res = await fetch(`/api/ia?accion=cargar_entrega&id_unico=${encodeURIComponent(sesionActual.id_unico)}&usuario=${encodeURIComponent(credencial)}`);
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
      if (estado) estado.textContent = '⚠️ No se encontró ninguna entrega con esa combinación de usuario y contraseña.';
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

  document.getElementById('btn-guardar-nube').addEventListener('click', async () => {
    let usuario = inputUsuario.value.trim().toLowerCase();
    let clave = inputClave ? inputClave.value.trim() : '';
    const msg = document.getElementById('mensaje-entrega');

    if (!usuario) {
      const uPedido = prompt('📧 Obligatorio para guardar: Escribe tu Email o Alias:');
      if (!uPedido || !uPedido.trim()) {
        if (msg) msg.textContent = '⚠️ Guardado cancelado: falta el Email o Alias.';
        return;
      }
      usuario = uPedido.trim().toLowerCase();
      inputUsuario.value = usuario;
    }

    if (!clave) {
      const cPedida = prompt('🔑 Obligatorio para guardar: Escribe una contraseña o PIN personal para proteger tu sesión:');
      if (!cPedida || !cPedida.trim()) {
        if (msg) msg.textContent = '⚠️ Guardado cancelado: es obligatorio indicar una contraseña.';
        if (inputClave) {
          irAZona('zona-0');
          inputClave.focus();
        }
        return;
      }
      clave = cPedida.trim();
      if (inputClave) inputClave.value = clave;
    }

    guardarLocal();
    if (msg) msg.textContent = '📤 Guardando sesión de forma segura...';

    const payload = {
      accion: 'guardar_entrega',
      id_unico: sesionActual.id_unico,
      usuario: `${usuario}::${clave}`,
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
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        if (msg) msg.textContent = '✅ ¡Sesión guardada correctamente con tu contraseña!';
      } else {
        if (msg) msg.textContent = `⚠️ Guardado en el navegador (${data.error || 'error de conexión con la nube'})`;
      }
    } catch (e) {
      if (msg) msg.textContent = '✅ Guardado en copia local.';
    }
  });

  document.getElementById('btn-descargar-pdf').addEventListener('click', (e) => {
    e.preventDefault();
    sincronizarCajasTexto();
    window.print();
  });

  window.addEventListener('beforeprint', sincronizarCajasTexto);

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
      id_unico: (document.getElementById('admin-id').value || 'COOP-S1').trim(),
      curso: document.getElementById('admin-curso').value,
      num_sesion: (document.getElementById('admin-num').value || 'Sesión 1').trim(),
      titulo: (document.getElementById('admin-titulo').value || 'Sin título').trim(),
      teoria: document.getElementById('admin-teoria').value.trim(),
      multimedia_html: document.getElementById('admin-multimedia').value.trim(),
      consigna_tarea: document.getElementById('admin-tarea').value.trim(),
      reto_gunawardena: document.getElementById('admin-gunawardena').value.trim(),
      padlet_html: document.getElementById('admin-padlet').value.trim()
    };

    if (estado) estado.textContent = '⏳ Publicando sesión en la base de datos...';

    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva)
      });
      const data = await res.json();

      if (res.ok && !data.error) {
        CATALOGO = CATALOGO.filter(s => s.id_unico !== nueva.id_unico);
        CATALOGO.push(nueva);
        poblarSelectCursos();
        selectCurso.value = nueva.curso;
        poblarSelectSesiones();
        const nuevoIdx = sesionesFiltradas.findIndex(s => s.id_unico === nueva.id_unico);
        if (nuevoIdx >= 0) selectSesion.value = String(nuevoIdx);
        renderizarSesion(nueva);
        if (estado) estado.textContent = `✅ Sesión ${nueva.id_unico} publicada y activa.`;
      } else {
        if (estado) estado.textContent = `⚠️ Error: ${data.error || 'No se pudo publicar en la base de datos'}`;
      }
    } catch (err) {
      if (estado) estado.textContent = '❌ Error de red al conectar con el servidor.';
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
    sincronizarCajasTexto();
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
        if (d.fb_gun) mostrarRespuestaIA('GUNAWARDENA', d.fb_gunawardena || d.fb_gun);
      } catch (e) {}
    }
    document.getElementById('contador-ia').textContent = consultasIA;
    sincronizarCajasTexto();
  }

  inputUsuario.addEventListener('change', cargarLocal);

  document.querySelectorAll('textarea').forEach(el => {
    el.addEventListener('input', guardarLocal);
  });

  inicializarCatalogo();
});
