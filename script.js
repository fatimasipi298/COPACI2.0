/* ==========================================================
   COPACI GRANJAS GUADALUPE - VERSION 2.0
   Proyecto escolar: almacenamiento local con localStorage.
   IMPORTANTE: no usar este sistema como plataforma real con
   datos personales. localStorage no ofrece seguridad real.
   ========================================================== */

"use strict";

const KEYS = {
  users: "copaci_v2_usuarios",
  requests: "copaci_v2_solicitudes",
  session: "copaci_v2_sesion"
};

let usuarioActual = null;
let toastTimer = null;

const DEMO_USERS = [
  {
    id: "USR-ADMIN",
    nombre: "Administrador COPACI",
    direccion: "Granjas Guadalupe",
    email: "admin@copaci.com",
    password: "123456",
    rol: "administrador",
    creado: new Date().toISOString()
  },
  {
    id: "USR-VECINO",
    nombre: "Vecino de demostración",
    direccion: "Calle de ejemplo, Granjas Guadalupe",
    email: "vecino@copaci.com",
    password: "123456",
    rol: "vecino",
    creado: new Date().toISOString()
  }
];

document.addEventListener("DOMContentLoaded", inicializar);

function inicializar() {
  if (!localStorage.getItem(KEYS.users)) {
    guardar(KEYS.users, DEMO_USERS);
  }
  if (!localStorage.getItem(KEYS.requests)) {
    guardar(KEYS.requests, []);
  }

  document.getElementById("formLogin").addEventListener("submit", iniciarSesion);
  document.getElementById("formRegister").addEventListener("submit", registrarUsuario);

  const sesion = sessionStorage.getItem(KEYS.session);
  if (sesion) {
    const usuario = obtenerUsuarios().find(u => u.id === sesion);
    if (usuario) {
      usuarioActual = usuario;
      mostrarDashboard(usuario);
      return;
    }
    sessionStorage.removeItem(KEYS.session);
  }
  mostrarLogin();
}

function leer(clave, respaldo) {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? JSON.parse(valor) : respaldo;
  } catch (error) {
    console.error("No se pudo leer el almacenamiento:", error);
    return respaldo;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.error("No se pudo guardar:", error);
    alert("No fue posible guardar la información. Revisa el almacenamiento del navegador.");
    return false;
  }
}

function obtenerUsuarios() {
  return leer(KEYS.users, []);
}

function obtenerSolicitudes() {
  return leer(KEYS.requests, []);
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[caracter]));
}

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function mostrarRegistro() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function mostrarLogin() {
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const usuario = obtenerUsuarios().find(u => u.email.toLowerCase() === email && u.password === password);

  if (!usuario) {
    alert("Correo o contraseña incorrectos.");
    return;
  }

  usuarioActual = usuario;
  sessionStorage.setItem(KEYS.session, usuario.id);
  mostrarDashboard(usuario);
  document.getElementById("formLogin").reset();
}

function registrarUsuario(event) {
  event.preventDefault();

  const nombre = document.getElementById("registerName").value.trim();
  const direccion = document.getElementById("registerAddress").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;

  if (nombre.length < 3 || !direccion || !emailValido(email) || password.length < 6) {
    alert("Verifica los datos. Todos los campos son obligatorios y la contraseña debe tener al menos 6 caracteres.");
    return;
  }

  const usuarios = obtenerUsuarios();
  if (usuarios.some(u => u.email.toLowerCase() === email)) {
    alert("Este correo ya está registrado.");
    return;
  }

  const nuevoUsuario = {
    id: generarId("USR"),
    nombre,
    direccion,
    email,
    password,
    rol: "vecino",
    creado: new Date().toISOString()
  };

  usuarios.push(nuevoUsuario);
  if (!guardar(KEYS.users, usuarios)) return;

  document.getElementById("formRegister").reset();
  mostrarLogin();
  mostrarToast("¡Registro exitoso! Ya puedes iniciar sesión.");
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generarId(prefijo) {
  const fecha = new Date();
  const marca = fecha.getFullYear().toString() +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0");
  const aleatorio = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefijo}-${marca}-${aleatorio}`;
}

function generarFolio(tipo) {
  const prefijo = tipo === "constancia" ? "CON" : tipo === "luminaria" ? "LUM" : "BAC";
  return generarId(prefijo);
}

function fechaLocal(fecha = new Date()) {
  return fecha.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
}

function obtenerNombreRol(rol) {
  return rol === "administrador" ? "Administrador COPACI" : "Vecino / Ciudadano";
}

function mostrarDashboard(usuario) {
  document.getElementById("authPage").classList.add("hidden");
  document.getElementById("dashboardPage").classList.remove("hidden");
  document.getElementById("welcomeMessage").textContent = `¡Bienvenido, ${usuario.nombre}!`;
  document.getElementById("userName").textContent = usuario.nombre;
  document.getElementById("userRole").textContent = obtenerNombreRol(usuario.rol);
  cargarOpciones(usuario.rol);
  mostrarInicio();
}

function cargarOpciones(rol) {
  const tarjetas = rol === "administrador" ? [
    ["📋", "Gestionar solicitudes", "Revisa constancias, reportes de luminarias y bacheo.", "admin"],
    ["👥", "Usuarios registrados", "Consulta las cuentas de vecinos registrados.", "usuarios"],
    ["📊", "Estadísticas", "Consulta el resumen de solicitudes recibidas.", "estadisticas"]
  ] : [
    ["📄", "Solicitar constancia", "Solicita una constancia de residencia y genera tu comprobante.", "constancia"],
    ["💡", "Reporte de luminarias", "Informa sobre lámparas apagadas o dañadas.", "luminaria"],
    ["🛣️", "Reporte de bacheo", "Registra baches y daños en la carpeta asfáltica.", "bacheo"],
    ["🔎", "Mis solicitudes", "Consulta el estado y folio de tus trámites y reportes.", "mis"]
  ];

  const contenedor = document.getElementById("roleCards");
  contenedor.innerHTML = "";
  tarjetas.forEach(([icono, titulo, texto, accion]) => {
    const article = document.createElement("article");
    article.className = "card";
    article.innerHTML = `
      <div class="card-icon">${icono}</div>
      <h3>${escapar(titulo)}</h3>
      <p>${escapar(texto)}</p>
      <button type="button" onclick="accionTarjeta('${accion}')">Acceder →</button>`;
    contenedor.appendChild(article);
  });
}

function accionTarjeta(accion) {
  if (!usuarioActual) return;
  const vistas = {
    constancia: mostrarFormularioConstancia,
    luminaria: mostrarFormularioLuminaria,
    bacheo: mostrarFormularioBacheo,
    mis: mostrarMisSolicitudes,
    admin: mostrarAdministracion,
    usuarios: mostrarUsuarios,
    estadisticas: mostrarEstadisticas
  };
  if (vistas[accion]) {
    vistas[accion]();
    document.getElementById("workArea").scrollIntoView({ behavior: "smooth" });
  }
}

function encabezadoVista(etiqueta, titulo, descripcion = "") {
  return `<div class="view-heading"><span class="etiqueta">${escapar(etiqueta)}</span>
    <h2>${escapar(titulo)}</h2>${descripcion ? `<p>${escapar(descripcion)}</p>` : ""}</div>`;
}

function mostrarVista(contenido) {
  document.getElementById("viewContainer").innerHTML = contenido;
}

function mostrarInicio() {
  mostrarVista(`
    <div class="welcome-panel">
      <div>${encabezadoVista("PANEL PRINCIPAL", "¿Qué deseas hacer hoy?", "Selecciona una opción del panel de servicios para comenzar.")}</div>
      <p class="helper-box">Recuerda guardar tu folio. Con él podrás identificar tu solicitud cuando consultes su seguimiento.</p>
    </div>`);
}

function mostrarFormularioConstancia() {
  if (usuarioActual.rol !== "vecino") return;
  mostrarVista(`
    ${encabezadoVista("TRÁMITES COMUNITARIOS", "Solicitud de constancia de residencia", "Completa los datos para generar tu solicitud y comprobante digital.")}
    <form class="data-form" id="formConstancia">
      <div class="form-grid">
        <div><label>Nombre del solicitante</label><input value="${escapar(usuarioActual.nombre)}" disabled></div>
        <div><label>Correo electrónico</label><input value="${escapar(usuarioActual.email)}" disabled></div>
        <div class="full"><label>Dirección de residencia</label><input id="constDireccion" value="${escapar(usuarioActual.direccion)}" maxlength="180" required></div>
        <div class="full"><label>Motivo de la constancia</label><textarea id="constMotivo" rows="3" maxlength="500" placeholder="Indica para qué necesitas la constancia..." required></textarea></div>
      </div>
      <button class="btn-primary form-submit" type="submit">Generar solicitud y comprobante</button>
    </form>`);
  document.getElementById("formConstancia").addEventListener("submit", crearConstancia);
}

function crearConstancia(event) {
  event.preventDefault();
  const direccion = document.getElementById("constDireccion").value.trim();
  const motivo = document.getElementById("constMotivo").value.trim();
  if (!direccion || !motivo) return;

  const solicitud = {
    id: generarFolio("constancia"),
    tipo: "constancia",
    titulo: "Constancia de residencia",
    usuarioId: usuarioActual.id,
    nombre: usuarioActual.nombre,
    email: usuarioActual.email,
    direccion,
    motivo,
    fecha: new Date().toISOString(),
    estatus: "Pendiente",
    observaciones: ""
  };
  const solicitudes = obtenerSolicitudes();
  solicitudes.unshift(solicitud);
  if (!guardar(KEYS.requests, solicitudes)) return;
  mostrarComprobante(solicitud);
}

function mostrarComprobante(s) {
  mostrarVista(`
    <div class="receipt" id="receipt">
      <div class="receipt-top"><div class="logo"><span class="logo-cuadro">GG</span><div><strong>COPACI</strong><small>Granjas Guadalupe</small></div></div><span class="receipt-label">COMPROBANTE DE SOLICITUD</span></div>
      <h2>Solicitud de constancia de residencia</h2>
      <p class="folio-line">Folio: <strong>${escapar(s.id)}</strong></p>
      <div class="receipt-data">
        <p><b>Ciudadano solicitante:</b> ${escapar(s.nombre)}</p>
        <p><b>Correo:</b> ${escapar(s.email)}</p>
        <p><b>Domicilio:</b> ${escapar(s.direccion)}</p>
        <p><b>Motivo:</b> ${escapar(s.motivo)}</p>
        <p><b>Fecha de solicitud:</b> ${escapar(fechaLocal(new Date(s.fecha)))}</p>
        <p><b>Estatus:</b> ${escapar(s.estatus)}</p>
      </div>
      <p class="receipt-note">Este documento es un comprobante de recepción de solicitud; no constituye una constancia oficial ni acredita por sí mismo la residencia.</p>
      <div class="signature-grid"><div><span>____________________________</span><b>Firma del solicitante</b></div><div><span>____________________________</span><b>Espacio para sello y firma del COPACI</b></div></div>
    </div>
    <div class="action-row no-print"><button class="btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button><button class="btn-secondary" onclick="mostrarMisSolicitudes()">Ver mis solicitudes</button></div>`);
}

function mostrarFormularioLuminaria() {
  if (usuarioActual.rol !== "vecino") return;
  mostrarVista(`
    ${encabezadoVista("SERVICIOS PÚBLICOS", "Reporte de luminarias", "Registra una lámpara apagada, dañada o con funcionamiento irregular.")}
    <form class="data-form" id="formLuminaria">
      <div class="form-grid">
        <div><label>Ubicación / calle</label><input id="lumCalle" maxlength="180" placeholder="Calle y número aproximado" required></div>
        <div><label>Entre qué calles se ubica</label><input id="lumEntre" maxlength="180" placeholder="Entre calle A y calle B" required></div>
        <div class="full"><label>Descripción del fallo</label><textarea id="lumDescripcion" rows="4" maxlength="700" placeholder="Describe si está apagada, parpadea, tiene daños, etc." required></textarea></div>
      </div>
      <button class="btn-primary form-submit" type="submit">Enviar reporte</button>
    </form>`);
  document.getElementById("formLuminaria").addEventListener("submit", crearReporteLuminaria);
}

function crearReporteLuminaria(event) {
  event.preventDefault();
  const solicitud = {
    id: generarFolio("luminaria"), tipo: "luminaria", titulo: "Reporte de luminaria",
    usuarioId: usuarioActual.id, nombre: usuarioActual.nombre, email: usuarioActual.email,
    ubicacion: document.getElementById("lumCalle").value.trim(),
    entreCalles: document.getElementById("lumEntre").value.trim(),
    descripcion: document.getElementById("lumDescripcion").value.trim(),
    fecha: new Date().toISOString(), estatus: "Pendiente", observaciones: ""
  };
  guardarNuevaSolicitud(solicitud, "Tu reporte de luminaria fue registrado.");
}

function mostrarFormularioBacheo() {
  if (usuarioActual.rol !== "vecino") return;
  mostrarVista(`
    ${encabezadoVista("SERVICIOS PÚBLICOS", "Reporte de bacheo", "Informa sobre baches o daños en la carpeta asfáltica.")}
    <form class="data-form" id="formBacheo">
      <div class="form-grid">
        <div class="full"><label>Ubicación / dirección</label><input id="bacUbicacion" maxlength="180" placeholder="Calle, número o referencia" required></div>
        <div><label>Nivel de gravedad</label><select id="bacGravedad" required><option value="">Selecciona una opción</option><option>Bajo</option><option>Medio</option><option>Alto</option></select></div>
        <div class="full"><label>Descripción del problema</label><textarea id="bacDescripcion" rows="4" maxlength="700" placeholder="Describe el tamaño, profundidad o riesgo que representa..." required></textarea></div>
      </div>
      <button class="btn-primary form-submit" type="submit">Enviar reporte</button>
    </form>`);
  document.getElementById("formBacheo").addEventListener("submit", crearReporteBacheo);
}

function crearReporteBacheo(event) {
  event.preventDefault();
  const solicitud = {
    id: generarFolio("bacheo"), tipo: "bacheo", titulo: "Reporte de bacheo",
    usuarioId: usuarioActual.id, nombre: usuarioActual.nombre, email: usuarioActual.email,
    ubicacion: document.getElementById("bacUbicacion").value.trim(),
    gravedad: document.getElementById("bacGravedad").value,
    descripcion: document.getElementById("bacDescripcion").value.trim(),
    fecha: new Date().toISOString(), estatus: "Pendiente", observaciones: ""
  };
  guardarNuevaSolicitud(solicitud, "Tu reporte de bacheo fue registrado.");
}

function guardarNuevaSolicitud(solicitud, mensaje) {
  const solicitudes = obtenerSolicitudes();
  solicitudes.unshift(solicitud);
  if (!guardar(KEYS.requests, solicitudes)) return;
  mostrarToast(`${mensaje} Folio: ${solicitud.id}`);
  mostrarDetalleSolicitud(solicitud);
}

function mostrarDetalleSolicitud(s) {
  const ubicacion = s.ubicacion || s.direccion || "";
  mostrarVista(`
    <div class="success-panel"><div class="success-icon">✓</div><h2>Solicitud registrada</h2><p>Tu información se guardó correctamente en este navegador.</p>
      <div class="folio-box"><span>Folio de seguimiento</span><strong>${escapar(s.id)}</strong></div>
      <p><b>Tipo:</b> ${escapar(s.titulo)}<br><b>Fecha:</b> ${escapar(fechaLocal(new Date(s.fecha)))}<br><b>Ubicación:</b> ${escapar(ubicacion)}</p>
      <button class="btn-primary" onclick="mostrarMisSolicitudes()">Consultar mis solicitudes</button>
    </div>`);
}

function claseEstatus(estatus) {
  return estatus.toLowerCase().replace(/\s+/g, "-");
}

function etiquetaEstatus(estatus) {
  return `<span class="status status-${escapar(claseEstatus(estatus))}">${escapar(estatus)}</span>`;
}

function mostrarMisSolicitudes() {
  const solicitudes = obtenerSolicitudes().filter(s => s.usuarioId === usuarioActual.id);
  const filas = solicitudes.map(s => `
    <tr>
      <td><strong>${escapar(s.id)}</strong><small>${escapar(s.titulo)}</small></td>
      <td>${escapar(fechaLocal(new Date(s.fecha)))}</td>
      <td>${etiquetaEstatus(s.estatus)}</td>
      <td><button class="table-action" onclick="verSolicitud('${escapar(s.id)}')">Ver detalle</button></td>
    </tr>`).join("");

  mostrarVista(`
    ${encabezadoVista("SEGUIMIENTO", "Mis solicitudes", "Consulta los folios y el avance de tus trámites y reportes.")}
    ${solicitudes.length ? `<div class="table-wrap"><table><thead><tr><th>Folio / Tipo</th><th>Fecha</th><th>Estatus</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>` : `<div class="empty-state">Aún no tienes solicitudes registradas. Utiliza las tarjetas de arriba para comenzar.</div>`}`);
}

function verSolicitud(folio) {
  const s = obtenerSolicitudes().find(x => x.id === folio);
  if (!s || (usuarioActual.rol !== "administrador" && s.usuarioId !== usuarioActual.id)) return;
  const detalles = s.tipo === "constancia"
    ? `<p><b>Domicilio:</b> ${escapar(s.direccion)}</p><p><b>Motivo:</b> ${escapar(s.motivo)}</p>`
    : s.tipo === "luminaria"
      ? `<p><b>Ubicación:</b> ${escapar(s.ubicacion)}</p><p><b>Entre calles:</b> ${escapar(s.entreCalles)}</p><p><b>Descripción:</b> ${escapar(s.descripcion)}</p>`
      : `<p><b>Ubicación:</b> ${escapar(s.ubicacion)}</p><p><b>Gravedad:</b> ${escapar(s.gravedad)}</p><p><b>Descripción:</b> ${escapar(s.descripcion)}</p>`;

  mostrarVista(`
    ${encabezadoVista("DETALLE DE SOLICITUD", s.titulo)}
    <div class="detail-card"><p><b>Folio:</b> ${escapar(s.id)}</p><p><b>Solicitante:</b> ${escapar(s.nombre)}</p><p><b>Fecha:</b> ${escapar(fechaLocal(new Date(s.fecha)))}</p>${detalles}<p><b>Estatus:</b> ${etiquetaEstatus(s.estatus)}</p><p><b>Observaciones del COPACI:</b> ${escapar(s.observaciones || "Sin observaciones.")}</p>
    ${s.tipo === "constancia" ? `<button class="btn-secondary" onclick="mostrarComprobantePorFolio('${escapar(s.id)}')">Ver comprobante</button>` : ""}
    <button class="btn-secondary" onclick="${usuarioActual.rol === "administrador" ? "mostrarAdministracion()" : "mostrarMisSolicitudes()"}">Volver</button></div>`);
}

function mostrarComprobantePorFolio(folio) {
  const s = obtenerSolicitudes().find(x => x.id === folio && x.usuarioId === usuarioActual.id);
  if (s) mostrarComprobante(s);
}

function mostrarAdministracion() {
  if (usuarioActual.rol !== "administrador") return;
  const solicitudes = obtenerSolicitudes();
  const filas = solicitudes.map(s => `
    <tr>
      <td><strong>${escapar(s.id)}</strong><small>${escapar(s.titulo)}</small></td>
      <td>${escapar(s.nombre)}</td>
      <td>${escapar(fechaLocal(new Date(s.fecha)))}</td>
      <td>${etiquetaEstatus(s.estatus)}</td>
      <td><button class="table-action" onclick="editarSolicitud('${escapar(s.id)}')">Gestionar</button></td>
    </tr>`).join("");
  mostrarVista(`
    ${encabezadoVista("MESA DIRECTIVA COPACI", "Gestión de solicitudes", "Revisa los registros y actualiza su estatus.")}
    <div class="admin-summary"><div><strong>${solicitudes.length}</strong><span>Total</span></div><div><strong>${solicitudes.filter(s => s.estatus === "Pendiente").length}</strong><span>Pendientes</span></div><div><strong>${solicitudes.filter(s => s.estatus === "En revisión").length}</strong><span>En revisión</span></div><div><strong>${solicitudes.filter(s => s.estatus === "Aprobada" || s.estatus === "Atendida").length}</strong><span>Concluidas</span></div></div>
    ${solicitudes.length ? `<div class="table-wrap"><table><thead><tr><th>Folio / Tipo</th><th>Solicitante</th><th>Fecha</th><th>Estatus</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>` : `<div class="empty-state">Todavía no hay solicitudes registradas.</div>`}`);
}

function editarSolicitud(folio) {
  if (usuarioActual.rol !== "administrador") return;
  const s = obtenerSolicitudes().find(x => x.id === folio);
  if (!s) return;
  const opciones = ["Pendiente", "En revisión", "Aprobada", "Atendida", "Rechazada"];
  mostrarVista(`
    ${encabezadoVista("ADMINISTRACIÓN", "Actualizar solicitud", `Folio: ${s.id}`)}
    <form id="formActualizar" class="data-form">
      <p><b>Solicitante:</b> ${escapar(s.nombre)} · ${escapar(s.email)}</p>
      <p><b>Tipo:</b> ${escapar(s.titulo)}</p>
      <p><b>Descripción / motivo:</b> ${escapar(s.descripcion || s.motivo || "")}</p>
      <label for="nuevoEstatus">Estatus</label>
      <select id="nuevoEstatus">${opciones.map(o => `<option ${s.estatus === o ? "selected" : ""}>${o}</option>`).join("")}</select>
      <label for="observacionesAdmin">Observaciones para el ciudadano</label>
      <textarea id="observacionesAdmin" rows="4" maxlength="600" placeholder="Escribe una nota sobre la atención...">${escapar(s.observaciones || "")}</textarea>
      <div class="action-row"><button type="submit" class="btn-primary">Guardar cambios</button><button type="button" class="btn-secondary" onclick="mostrarAdministracion()">Cancelar</button></div>
    </form>`);
  document.getElementById("formActualizar").addEventListener("submit", event => {
    event.preventDefault();
    const solicitudes = obtenerSolicitudes();
    const indice = solicitudes.findIndex(x => x.id === folio);
    if (indice < 0) return;
    solicitudes[indice].estatus = document.getElementById("nuevoEstatus").value;
    solicitudes[indice].observaciones = document.getElementById("observacionesAdmin").value.trim();
    solicitudes[indice].actualizado = new Date().toISOString();
    if (guardar(KEYS.requests, solicitudes)) {
      mostrarToast("La solicitud fue actualizada.");
      mostrarAdministracion();
    }
  });
}

function mostrarUsuarios() {
  if (usuarioActual.rol !== "administrador") return;
  const usuarios = obtenerUsuarios();
  const filas = usuarios.map(u => `<tr><td>${escapar(u.nombre)}</td><td>${escapar(u.email)}</td><td>${escapar(u.direccion || "—")}</td><td>${escapar(obtenerNombreRol(u.rol))}</td></tr>`).join("");
  mostrarVista(`${encabezadoVista("ADMINISTRACIÓN", "Usuarios registrados", "Consulta las cuentas creadas en este navegador.")}<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Dirección</th><th>Rol</th></tr></thead><tbody>${filas}</tbody></table></div>`);
}

function mostrarEstadisticas() {
  if (usuarioActual.rol !== "administrador") return;
  const solicitudes = obtenerSolicitudes();
  const contar = tipo => solicitudes.filter(s => s.tipo === tipo).length;
  mostrarVista(`
    ${encabezadoVista("RESUMEN GENERAL", "Estadísticas del sistema", "Conteo de solicitudes almacenadas localmente.")}
    <div class="stats-grid">
      <div class="stat-card"><span>📄</span><strong>${contar("constancia")}</strong><p>Constancias</p></div>
      <div class="stat-card"><span>💡</span><strong>${contar("luminaria")}</strong><p>Reportes de luminarias</p></div>
      <div class="stat-card"><span>🛣️</span><strong>${contar("bacheo")}</strong><p>Reportes de bacheo</p></div>
      <div class="stat-card"><span>📌</span><strong>${solicitudes.filter(s => s.estatus === "Pendiente").length}</strong><p>Pendientes</p></div>
    </div>`);
}

function cerrarSesion() {
  sessionStorage.removeItem(KEYS.session);
  usuarioActual = null;
  document.getElementById("dashboardPage").classList.add("hidden");
  document.getElementById("authPage").classList.remove("hidden");
  mostrarLogin();
  mostrarToast("Sesión cerrada correctamente.");
}

/* Función auxiliar para reiniciar los datos de demostración desde la consola:
   reiniciarDatosDemo() */
function reiniciarDatosDemo() {
  if (!confirm("¿Deseas borrar los usuarios y solicitudes guardados y restaurar los datos de demostración?")) return;
  localStorage.removeItem(KEYS.users);
  localStorage.removeItem(KEYS.requests);
  sessionStorage.removeItem(KEYS.session);
  location.reload();
}
