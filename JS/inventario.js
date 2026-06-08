// Función de protección de interfaz
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html";
    }
})();

import { get, del } from './api.js';

// Variables globales para almacenamiento y filtrado reactivo
let listaActivosGlobal = [];
let listaEspaciosGlobal = [];
let listaNivelesGlobal = [];
let listaEdificiosGlobal = [];
let listaResponsablesGlobal = [];

async function cargarInventario() {
    const tabla = document.querySelector("table tbody");
    if (!tabla) return;

    try {
        // 1. Descargar TODOS los catálogos relacionales en paralelo (Velocidad óptima)
        const [activos, espacios, niveles, edificios, responsables] = await Promise.all([
            get('/assets/activos/'),
            get('/locations/espacios/'),
            get('/locations/niveles/'),
            get('/locations/edificios/'),
            get('/assets/responsables/')
        ]);

        // Guardamos en memoria global
        listaActivosGlobal = activos;
        listaEspaciosGlobal = espacios;
        listaNivelesGlobal = niveles;
        listaEdificiosGlobal = edificios;
        listaResponsablesGlobal = responsables;

        // 2. Actualizar tarjetas analíticas superiores
        const dnsOnline = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado || "Online") === "Online");
        const dnsOffline = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado) === "Offline");
        const dnsWarning = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado) === "Intermitente");

        const totalCard = document.querySelector(".summary-card:nth-child(1) p");
        const onlineCard = document.querySelector(".summary-card:nth-child(2) p");
        const offlineCard = document.querySelector(".summary-card:nth-child(3) p");
        const warningCard = document.querySelector(".summary-card:nth-child(4) p");

        if (totalCard) totalCard.textContent = listaActivosGlobal.length;
        if (onlineCard) onlineCard.textContent = dnsOnline.length;
        if (offlineCard) offlineCard.textContent = dnsOffline.length;
        if (warningCard) warningCard.textContent = dnsWarning.length;

        // 3. Renderizar la tabla con la jerarquía construida
        renderizarTablaInventario(listaActivosGlobal);

    } catch (error) {
        console.error("Error al cargar los catálogos de inventario:", error);
    }
}

/**
 * Renderiza las filas construyendo la cadena jerárquica: Edificio / Piso X / Aula
 */
function renderizarTablaInventario(activosLista) {
    const tabla = document.querySelector("table tbody");
    if (!tabla) return;

    tabla.innerHTML = "";

    if (activosLista.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#718096; font-style:italic; padding:20px;">No se encontraron activos.</td></tr>`;
        return;
    }

    activosLista.forEach(activo => {
        // =========================================================================
        // CONSTRUCCIÓN DE LA UBICACIÓN JERÁRQUICA (EDIFICIO / PISO / AULA)
        // =========================================================================
        let cadenaUbicacion = "No asignada";

        // 1. Buscar Espacio (Aula / Laboratorio / Cuarto Red)
        const espacio = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(activo.id_espacio));
        if (espacio) {
            const nombreAula = espacio.nombre_aula; // Ej: "Lab 1", "Cuarto Red"

            // 2. Buscar Nivel (Piso)
            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            if (nivel) {
                const txtPiso = `Piso ${nivel.numero_nivel}`; // Ej: "Piso 1"

                // 3. Buscar Edificio
                const edificio = listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio));
                const nombreEdificio = edificio ? edificio.nombre : "Edificio Indefinido"; // Ej: "Edificio A", "Biblioteca"

                // Ensamblar la cadena exactamente como la captura: Edificio A / Piso 1 / Lab 1
                cadenaUbicacion = `${nombreEdificio} / ${txtPiso} / ${nombreAula}`;
            } else {
                // Respaldo si no encuentra el nivel intermedio
                cadenaUbicacion = `${espacio.nombre_aula}`;
            }
        }

        // =========================================================================
        // RESOLVER RESPONSABLE Y ESTADO
        // =========================================================================
        const resp = listaResponsablesGlobal.find(r => Number(r.id_responsable) === Number(activo.id_responsable));
        const nombreResponsable = resp ? resp.nombre_completo : "Sin asignar";

        const estadoActual = activo.estado_operativo || activo.estado || "Online";

        // Creamos la fila manteniendo la estructura de tu tabla
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><strong>${activo.hostname || activo.nombre_activo || 'paquito'}</strong></td>
            <td>${activo.ip_estatica || activo.ip_activo || 'Sin IP'}</td>
            <td><code>${activo.mac_address || activo.mac_activo || 'N/A'}</code></td>
            <td>${cadenaUbicacion}</td>
            <td>👤 ${nombreResponsable}</td>
            <td><span class="status-badge ${estadoActual.toLowerCase()}">${estadoActual}</span></td>
            <td>
                <button class="btn-view" data-id="${activo.id_activo}" style="background:#005b2e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Ver Equipo</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    // Escuchador de redirección para ir a la vista de detalle
    document.querySelectorAll(".btn-view").forEach(boton => {
        boton.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            window.location.href = `equipo.html?id=${id}`;
        });
    });
}

// =========================================================================
// FILTRADO INTELIGENTE INTEGRADO
// =========================================================================
function ejecutarFiltradoInventario() {
    const texto = document.querySelector(".filters input").value.toLowerCase().trim();
    const estadoSel = document.querySelector(".filters select").value;

    const activosFiltrados = listaActivosGlobal.filter(activo => {
        const estadoActual = (activo.estado_operativo || activo.estado || "Online").toLowerCase();
        
        // Re-mapeamos la ubicación de este activo para que la barra de búsqueda también la filtre si el usuario escribe "Biblioteca" o "Lab 1"
        const espacio = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(activo.id_espacio));
        let ubicacionTexto = "";
        if (espacio) {
            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            const edificio = nivel ? listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio)) : null;
            ubicacionTexto = `${edificio ? edificio.nombre_edificio : ""} piso ${nivel ? nivel.numero_nivel : ""} ${espacio.nombre_aula}`.toLowerCase();
        }

        const cumpleTexto = !texto || 
            (activo.hostname || "").toLowerCase().includes(texto) ||
            (activo.ip_estatica || "").toLowerCase().includes(texto) ||
            ubicacionTexto.includes(texto);

        const cumpleEstado = !estadoSel || estadoActual === estadoSel.toLowerCase();

        return cumpleTexto && cumpleEstado;
    });

    renderizarTablaInventario(activosFiltrados);
}

// Inicialización del script
document.addEventListener("DOMContentLoaded", () => {
    cargarInventario();

    const btnFiltrar = document.querySelector(".filters button");
    if (btnFiltrar) btnFiltrar.addEventListener("click", ejecutarFiltradoInventario);

    const inputBusqueda = document.querySelector(".filters input");
    if (inputBusqueda) inputBusqueda.addEventListener("input", ejecutarFiltradoInventario);
});