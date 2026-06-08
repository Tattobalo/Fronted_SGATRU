import { get } from './api.js';
import { navegarA } from './router.js';

let listaActivosGlobal = [];
let listaEspaciosGlobal = [];
let listaNivelesGlobal = [];
let listaEdificiosGlobal = [];
let listaResponsablesGlobal = [];

export async function cargarInventario() {
    try {
        const [activos, espacios, niveles, edificios, responsables] = await Promise.all([
            get('/assets/activos/'),
            get('/locations/espacios/'),
            get('/locations/niveles/'),
            get('/locations/edificios/'),
            get('/assets/responsables/')
        ]);

        listaActivosGlobal = activos;
        listaEspaciosGlobal = espacios;
        listaNivelesGlobal = niveles;
        listaEdificiosGlobal = edificios;
        listaResponsablesGlobal = responsables;

        const dnsOnline = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado || "Online") === "Online");
        const dnsOffline = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado) === "Offline");
        const dnsWarning = listaActivosGlobal.filter(a => (a.estado_operativo || a.estado) === "Intermitente");

        if (document.getElementById("total-activos")) document.getElementById("total-activos").textContent = listaActivosGlobal.length;
        if (document.getElementById("total-online")) document.getElementById("total-online").textContent = dnsOnline.length;
        if (document.getElementById("total-offline")) document.getElementById("total-offline").textContent = dnsOffline.length;
        if (document.getElementById("total-intermitentes")) document.getElementById("total-intermitentes").textContent = dnsWarning.length;

        renderizarTablaInventario(listaActivosGlobal);
        vincularFiltrosInventario();

    } catch (error) {
        console.error("Error al cargar los catálogos de inventario:", error);
    }
}

function renderizarTablaInventario(activosLista) {
    const tabla = document.querySelector("#tabla-inventario tbody");
    if (!tabla) return;
    tabla.innerHTML = "";

    if (activosLista.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#718096; font-style:italic; padding:20px;">No se encontraron activos.</td></tr>`;
        return;
    }

    activosLista.forEach(activo => {
        let cadenaUbicacion = "No asignada";
        const espacio = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(activo.id_espacio));
        if (espacio) {
            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            const edificio = nivel ? listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio)) : null;
            cadenaUbicacion = `${edificio ? edificio.nombre : "Edificio Indefinido"} / Piso ${nivel ? nivel.numero_nivel : "?"} / ${espacio.nombre_aula}`;
        }

        const resp = listaResponsablesGlobal.find(r => Number(r.id_responsable) === Number(activo.id_responsable));
        const estadoActual = activo.estado_operativo || activo.estado || "Online";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><strong>${activo.hostname || activo.nombre_activo || 'paquito'}</strong></td>
            <td>${activo.ip_estatica || activo.ip_activo || 'Sin IP'}</td>
            <td><code>${activo.mac_address || activo.mac_activo || 'N/A'}</code></td>
            <td>${cadenaUbicacion}</td>
            <td>👤 ${resp ? resp.nombre_completo : "Sin asignar"}</td>
            <td><span class="status-badge ${estadoActual.toLowerCase()}">${estadoActual}</span></td>
            <td><button class="btn-view" data-id="${activo.id_activo}" style="background:#005b2e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ver Equipo</button></td>
        `;
        
        fila.querySelector(".btn-view").addEventListener("click", () => {
            navegarA(`/equipo?id=${activo.id_activo}`);
        });
        tabla.appendChild(fila);
    });
}

function ejecutarFiltradoInventario() {
    const texto = document.getElementById("buscar-activo").value.toLowerCase().trim();
    const estadoSel = document.getElementById("filtro-estado-activo").value;

    const activosFiltrados = listaActivosGlobal.filter(activo => {
        const estadoActual = (activo.estado_operativo || activo.estado || "Online").toLowerCase();
        const cumpleTexto = !texto || (activo.hostname || "").toLowerCase().includes(texto) || (activo.ip_estatica || "").toLowerCase().includes(texto);
        const cumpleEstado = !estadoSel || estadoActual === estadoSel.toLowerCase();
        return cumpleTexto && cumpleEstado;
    });

    renderizarTablaInventario(activosFiltrados);
}

function vincularFiltrosInventario() {
    const btnFiltrar = document.getElementById("btn-filtrar-activo");
    if (btnFiltrar) btnFiltrar.addEventListener("click", ejecutarFiltradoInventario);

    const inputBusqueda = document.getElementById("buscar-activo");
    if (inputBusqueda) inputBusqueda.addEventListener("input", ejecutarFiltradoInventario);
}