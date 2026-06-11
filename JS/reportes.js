(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html";
    }
})();

import { get } from './api.js';

// ─────────────────────────────────────────────────────────────
//  Estado global del módulo
// ─────────────────────────────────────────────────────────────
let listaActivosGlobal     = [];
let listaAlertasGlobal     = [];
let listaEspaciosGlobal    = [];
let listaNivelesGlobal     = [];
let listaEdificiosGlobal   = [];
let listaResponsablesGlobal = [];
let historialReportes      = [];   // Reportes generados en esta sesión

// ─────────────────────────────────────────────────────────────
//  PUNTO DE ENTRADA — Sincronizado con la base de datos
// ─────────────────────────────────────────────────────────────
export async function cargarReportes() {
    try {
        // Descarga paralela de todos los catálogos en vivo desde PostgreSQL
        const [activos, alertas, espacios, niveles, edificios, responsables] = await Promise.all([
            get('/assets/activos/').catch(() => []),
            get('/monitoring/alertas/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/locations/niveles/').catch(() => []),
            get('/locations/edificios/').catch(() => []),
            get('/assets/responsables/').catch(() => [])
        ]);

        listaActivosGlobal     = activos;
        listaAlertasGlobal     = alertas;
        listaEspaciosGlobal    = espacios;
        listaNivelesGlobal     = niveles;
        listaEdificiosGlobal   = edificios;
        listaResponsablesGlobal = responsables;

        // Renderizado e interacción del DOM
        actualizarResumen();
        poblarSelectEdificios();
        vincularBotonesReporte();
        vincularFormPersonalizado();
        renderizarHistorial();

    } catch (error) {
        console.error("Error crítico al sincronizar datos de reportes:", error);
    }
}

// ─────────────────────────────────────────────────────────────
//  TARJETAS DE RESUMEN (Cálculos reales con datos del backend)
// ─────────────────────────────────────────────────────────────
function actualizarResumen() {
    const alertasActivas = listaAlertasGlobal.filter(a => !a.resuelta).length;
    
    // Obtener la fecha de la alerta más reciente en el sistema
    const ultimaFecha = listaAlertasGlobal.length
        ? new Date(Math.max(...listaAlertasGlobal.map(a => new Date(a.creada_at))))
              .toLocaleDateString('es-MX')
        : "Sin alertas";

    setTexto("total-reportes-generados", historialReportes.length);
    setTexto("total-activos-auditados",  listaActivosGlobal.length);
    setTexto("total-alertas-incluidas",  alertasActivas);
    setTexto("ultimo-reporte-fecha",     ultimaFecha);
}

// ─────────────────────────────────────────────────────────────
//  POBLAR SELECT DE EDIFICIOS (Estructura dinámica de la BD)
// ─────────────────────────────────────────────────────────────
function poblarSelectEdificios() {
    const sel = document.getElementById("filtro-edificio-reporte");
    if (!sel) return;

    sel.innerHTML = '<option value="">Todos</option>';
    listaEdificiosGlobal.forEach(ed => {
        const opt = document.createElement("option");
        opt.value = ed.id_edificio;
        opt.textContent = ed.nombre;
        sel.appendChild(opt);
    });
}

// ─────────────────────────────────────────────────────────────
//  BOTONES DE TARJETAS
// ─────────────────────────────────────────────────────────────
function vincularBotonesReporte() {
    // Reporte de Inventario
    document.getElementById("btn-inv-pdf")?.replaceWith(document.getElementById("btn-inv-pdf").cloneNode(true));
    document.getElementById("btn-inv-pdf")?.addEventListener("click", () => generarPDF("inventario"));
    
    document.getElementById("btn-inv-excel")?.replaceWith(document.getElementById("btn-inv-excel").cloneNode(true));
    document.getElementById("btn-inv-excel")?.addEventListener("click", () => exportarExcel("inventario"));

    // Reporte de Alertas
    document.getElementById("btn-ale-pdf")?.replaceWith(document.getElementById("btn-ale-pdf").cloneNode(true));
    document.getElementById("btn-ale-pdf")?.addEventListener("click", () => generarPDF("alertas"));
    
    document.getElementById("btn-ale-excel")?.replaceWith(document.getElementById("btn-ale-excel").cloneNode(true));
    document.getElementById("btn-ale-excel")?.addEventListener("click", () => exportarExcel("alertas"));

    // Reporte de Topología
    document.getElementById("btn-top-pdf")?.replaceWith(document.getElementById("btn-top-pdf").cloneNode(true));
    document.getElementById("btn-top-pdf")?.addEventListener("click", () => generarPDF("topologia"));
    
    document.getElementById("btn-top-mapa")?.replaceWith(document.getElementById("btn-top-mapa").cloneNode(true));
    document.getElementById("btn-top-mapa")?.addEventListener("click", () => alert("Vista de mapa disponible en la sección Topología."));

    // Reporte por Edificio
    document.getElementById("btn-edi-pdf")?.replaceWith(document.getElementById("btn-edi-pdf").cloneNode(true));
    document.getElementById("btn-edi-pdf")?.addEventListener("click", () => generarPDF("edificio"));
    
    document.getElementById("btn-edi-excel")?.replaceWith(document.getElementById("btn-edi-excel").cloneNode(true));
    document.getElementById("btn-edi-excel")?.addEventListener("click", () => exportarExcel("edificio"));
}

// ─────────────────────────────────────────────────────────────
//  FORMULARIO PERSONALIZADO
// ─────────────────────────────────────────────────────────────
function vincularFormPersonalizado() {
    const form = document.getElementById("form-reporte-personalizado");
    if (!form) return;

    form.replaceWith(form.cloneNode(true));
    const nuevoForm = document.getElementById("form-reporte-personalizado");

    nuevoForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const tipo     = document.getElementById("tipo-reporte-custom")?.value || "inventario";
        const edificio = document.getElementById("filtro-edificio-reporte")?.value || "";
        const estado   = document.getElementById("filtro-estado-reporte")?.value || "";
        const formato  = document.getElementById("formato-reporte")?.value || "PDF";

        if (formato === "PDF") {
            generarPDF(tipo, { edificio, estado });
        } else {
            exportarExcel(tipo, { edificio, estado });
        }
    });
}

// ─────────────────────────────────────────────────────────────
//  GENERAR PDF (Ventana de impresión nativa)
// ─────────────────────────────────────────────────────────────
function generarPDF(tipo, filtros = {}) {
    const datos   = obtenerDatosFiltrados(tipo, filtros);
    const titulo  = tituloReporte(tipo);
    const tabla   = construirTablaHTML(tipo, datos);
    const fecha   = new Date().toLocaleDateString('es-MX');
    const usuario = localStorage.getItem("sgatru_session") ? JSON.parse(localStorage.getItem("sgatru_session")).username : "Sistema";

    const ventana = window.open("", "_blank");
    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${titulo} - SGATRU</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; }
                h1   { color: #005b2e; border-bottom: 3px solid #d4af37; padding-bottom: 10px; }
                .meta { color: #555; font-size: 0.9em; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
                th    { background: #005b2e; color: white; padding: 10px; text-align: left; }
                td    { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
                tr:nth-child(even) td { background: #f7fafc; }
                .badge-ok  { color: #00a650; font-weight: bold; }
                .badge-err { color: #e53e3e; font-weight: bold; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h1>SGATRU — ${titulo}</h1>
            <p class="meta">Generado el ${fecha} por ${usuario} · Total registros obtenidos: ${datos.length}</p>
            ${tabla}
            <script>window.onload = () => { window.print(); }<\/script>
        </body>
        </html>
    `);
    ventana.document.close();

    registrarEnHistorial(titulo, tipo, "PDF", usuario);
}

// ─────────────────────────────────────────────────────────────
//  EXPORTAR EXCEL (Estructura CSV)
// ─────────────────────────────────────────────────────────────
function exportarExcel(tipo, filtros = {}) {
    const datos   = obtenerDatosFiltrados(tipo, filtros);
    const titulo  = tituloReporte(tipo);
    const usuario = localStorage.getItem("sgatru_session") ? JSON.parse(localStorage.getItem("sgatru_session")).username : "Sistema";

    let csv = "";

    if (tipo === "inventario") {
        csv  = "Hostname,IP Estatica,MAC Address,Ubicacion,Responsable,Estado\n";
        csv += datos.map(a => {
            const ub   = obtenerUbicacion(a.id_espacio);
            const resp = obtenerResponsable(a.id_responsable);
            const est  = tieneAlertaActiva(a.id_activo) ? "Offline" : "Online";
            return `"${a.hostname || ''}","${a.ip_estatica || ''}","${a.mac_address || ''}","${ub}","${resp}","${est}"`;
        }).join("\n");

    } else if (tipo === "alertas") {
        csv  = "Tipo Incidencia,Equipo,IP,Ubicacion,Estado,Fecha\n";
        csv += datos.map(al => {
            const act = listaActivosGlobal.find(a => Number(a.id_activo) === Number(al.id_activo)) || {};
            const ub  = obtenerUbicacion(act.id_espacio);
            const est = al.resuelta ? "Resuelta" : "Activa";
            const fec = al.creada_at ? new Date(al.creada_at).toLocaleString('es-MX') : "";
            return `"${al.tipo_incidencia || ''}","${act.hostname || ''}","${act.ip_estatica || ''}","${ub}","${est}","${fec}"`;
        }).join("\n");

    } else if (tipo === "edificio") {
        csv  = "Edificio,Piso,Aula,Activos,Online,Offline\n";
        csv += datos.map(row =>
            `"${row.edificio}","${row.piso}","${row.aula}","${row.total}","${row.online}","${row.offline}"`
        ).join("\n");

    } else {
        csv = "Sin datos disponibles para este formato.";
    }

    const blob   = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const link   = document.createElement("a");
    link.href    = url;
    link.download = `SGATRU_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    registrarEnHistorial(titulo, tipo, "Excel", usuario);
}

// ─────────────────────────────────────────────────────────────
//  CONSTRUIR TABLA HTML PARA EL PDF
// ─────────────────────────────────────────────────────────────
function construirTablaHTML(tipo, datos) {
    if (datos.length === 0) return "<p>No se encontraron registros que coincidan con los filtros seleccionados.</p>";

    if (tipo === "inventario") {
        let rows = datos.map(a => {
            const ub   = obtenerUbicacion(a.id_espacio);
            const resp = obtenerResponsable(a.id_responsable);
            const est  = tieneAlertaActiva(a.id_activo);
            return `<tr>
                <td>${a.hostname || '—'}</td>
                <td>${a.ip_estatica || '—'}</td>
                <td><code>${a.mac_address || '—'}</code></td>
                <td>${ub}</td>
                <td>${resp}</td>
                <td class="${est ? 'badge-err' : 'badge-ok'}">${est ? '● Offline' : '● Online'}</td>
            </tr>`;
        }).join("");
        return `<table><thead><tr>
            <th>Hostname</th><th>IP Estática</th><th>MAC Address</th>
            <th>Ubicación</th><th>Responsable</th><th>Estado</th>
        </tr></thead><tbody>${rows}</tbody></table>`;

    } else if (tipo === "alertas") {
        let rows = datos.map(al => {
            const act = listaActivosGlobal.find(a => Number(a.id_activo) === Number(al.id_activo)) || {};
            const ub  = obtenerUbicacion(act.id_espacio);
            const est = al.resuelta ? "Resuelta" : "Activa";
            const fec = al.creada_at ? new Date(al.creada_at).toLocaleString('es-MX') : "—";
            return `<tr>
                <td>${al.tipo_incidencia || '—'}</td>
                <td>${act.hostname || '—'}</td>
                <td>${act.ip_estatica || '—'}</td>
                <td>${ub}</td>
                <td class="${al.resuelta ? 'badge-ok' : 'badge-err'}">${est}</td>
                <td>${fec}</td>
            </tr>`;
        }).join("");
        return `<table><thead><tr>
            <th>Tipo Incidencia</th><th>Equipo</th><th>IP</th>
            <th>Ubicación</th><th>Estado</th><th>Detectada</th>
        </tr></thead><tbody>${rows}</tbody></table>`;

    } else if (tipo === "topologia") {
        let rows = datos.map(a => {
            const ub = obtenerUbicacion(a.id_espacio);
            return `<tr>
                <td>${a.hostname || '—'}</td>
                <td>${a.ip_estatica || '—'}</td>
                <td><code>${a.mac_address || '—'}</code></td>
                <td>${ub}</td>
            </tr>`;
        }).join("");
        return `<table><thead><tr>
            <th>Hostname</th><th>IP</th><th>MAC</th><th>Ubicación</th>
        </tr></thead><tbody>${rows}</tbody></table>`;

    } else if (tipo === "edificio") {
        let rows = datos.map(row => `<tr>
            <td>${row.edificio}</td>
            <td>Piso ${row.piso}</td>
            <td>${row.aula}</td>
            <td>${row.total}</td>
            <td class="badge-ok">${row.online}</td>
            <td class="badge-err">${row.offline}</td>
        </tr>`).join("");
        return `<table><thead><tr>
            <th>Edificio</th><th>Piso</th><th>Aula</th>
            <th>Total Activos</th><th>Online</th><th>Offline</th>
        </tr></thead><tbody>${rows}</tbody></table>`;
    }

    return "<p>Sin datos disponibles.</p>";
}

// ─────────────────────────────────────────────────────────────
//  FILTROS DE DATOS
// ─────────────────────────────────────────────────────────────
function obtenerDatosFiltrados(tipo, filtros = {}) {
    const { edificio = "", estado = "" } = filtros;

    if (tipo === "inventario" || tipo === "topologia") {
        return listaActivosGlobal.filter(a => {
            if (edificio) {
                const ub = obtenerIdEdificio(a.id_espacio);
                if (String(ub) !== String(edificio)) return false;
            }
            if (estado) {
                const offline = tieneAlertaActiva(a.id_activo);
                if (estado === "Online"  &&  offline) return false;
                if (estado === "Offline" && !offline) return false;
            }
            return true;
        });

    } else if (tipo === "alertas") {
        return listaAlertasGlobal.filter(al => {
            if (estado === "Online")  return al.resuelta;
            if (estado === "Offline") return !al.resuelta;
            return true;
        });

    } else if (tipo === "edificio") {
        const resumen = [];
        listaEspaciosGlobal.forEach(esp => {
            if (edificio && obtenerIdEdificio(esp.id_espacio) !== Number(edificio)) return;

            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(esp.id_nivel));
            const edif  = nivel ? listaEdificiosGlobal.find(e => Number(e.id_edificio) === Number(nivel.id_edificio)) : null;
            const activosEsp = listaActivosGlobal.filter(a => Number(a.id_espacio) === Number(esp.id_espacio));
            const online  = activosEsp.filter(a => !tieneAlertaActiva(a.id_activo)).length;
            const offline = activosEsp.filter(a =>  tieneAlertaActiva(a.id_activo)).length;

            resumen.push({
                edificio: edif ? edif.nombre : "Edificio ?",
                piso:     nivel ? nivel.numero_nivel : "?",
                aula:     esp.nombre_aula,
                total:    activosEsp.length,
                online,
                offline
            });
        });
        return resumen;
    }
    return [];
}

// ─────────────────────────────────────────────────────────────
//  HISTORIAL DE SESIÓN
// ─────────────────────────────────────────────────────────────
function registrarEnHistorial(nombre, tipo, formato, usuario) {
    historialReportes.unshift({
        nombre,
        tipo,
        fecha: new Date().toLocaleDateString('es-MX'),
        usuario,
        formato
    });
    actualizarResumen();
    renderizarHistorial();
}

function renderizarHistorial() {
    const tbody = document.querySelector("#tabla-historial-reportes tbody");
    if (!tbody) return;

    if (historialReportes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#718096; font-style:italic; padding:20px;">
            No se han generado reportes en esta sesión.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = historialReportes.map(r => `
        <tr>
            <td>${r.nombre}</td>
            <td><strong style="text-transform: capitalize;">${r.tipo}</strong></td>
            <td>${r.fecha}</td>
            <td>${r.usuario}</td>
            <td><span class="badge-ok" style="color: ${r.formato === 'PDF' ? '#e53e3e' : '#005b2e'}">${r.formato}</span></td>
            <td><span style="color:#718096; font-style:italic;">Descargado</span></td>
        </tr>
    `).join("");
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function tituloReporte(tipo) {
    const titulos = {
        inventario: "Reporte de Inventario",
        alertas:    "Reporte de Alertas",
        topologia:  "Reporte de Topología",
        edificio:   "Reporte por Edificio"
    };
    return titulos[tipo] || "Reporte SGATRU";
}

function obtenerUbicacion(idEspacio) {
    const esp = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(idEspacio));
    if (!esp) return "No asignada";
    const nivel   = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(esp.id_nivel));
    const edificio = nivel ? listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio)) : null;
    return `${edificio ? edificio.nombre : "?"} / Piso ${nivel ? nivel.numero_nivel : "?"} / ${esp.nombre_aula}`;
}

function obtenerIdEdificio(idEspacio) {
    const esp    = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(idEspacio));
    const nivel  = esp ? listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(esp.id_nivel)) : null;
    return nivel ? nivel.id_edificio : null;
}

function obtenerResponsable(idResponsable) {
    const r = listaResponsablesGlobal.find(r => Number(r.id_responsable) === Number(idResponsable));
    return r ? r.nombre_completo : "Sin asignar";
}

function tieneAlertaActiva(idActivo) {
    return listaAlertasGlobal.some(al => !al.resuelta && Number(al.id_activo) === Number(idActivo));
}

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}