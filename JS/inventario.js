(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { navegarA } from './router.js';

let listaActivosGlobal = [];
let listaEspaciosGlobal = [];
let listaNivelesGlobal = [];
let listaEdificiosGlobal = [];
let listaResponsablesGlobal = [];
let listaAlertasGlobal = []; 

export async function cargarInventario() {
    try {
        // 1. DESCARGA PARALELA (Incluimos las alertas reales del motor de monitoreo)
        const [activos, espacios, niveles, edificios, responsables, alertas] = await Promise.all([
            get('/assets/activos/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/locations/niveles/').catch(() => []),
            get('/locations/edificios/').catch(() => []),
            get('/assets/responsables/').catch(() => []),
            get('/monitoring/alertas/').catch(() => []) 
        ]);

        listaActivosGlobal = activos;
        listaEspaciosGlobal = espacios;
        listaNivelesGlobal = niveles;
        listaEdificiosGlobal = edificios;
        listaResponsablesGlobal = responsables;
        listaAlertasGlobal = alertas;

        // 2. MATEMÁTICA DE ESTADÍSTICAS REALES POR ALERTA
        let conteoOnline = 0;
        let conteoOffline = 0;

        listaActivosGlobal.forEach(activo => {
            const tieneAlerta = listaAlertasGlobal.some(al => al.resuelta === false && Number(al.id_activo) === Number(activo.id_activo));
            if (tieneAlerta) {
                conteoOffline++;
            } else {
                conteoOnline++;
            }
        });

        if (document.getElementById("total-activos")) document.getElementById("total-activos").textContent = listaActivosGlobal.length;
        if (document.getElementById("total-online")) document.getElementById("total-online").textContent = conteoOnline;
        if (document.getElementById("total-offline")) document.getElementById("total-offline").textContent = conteoOffline;
        if (document.getElementById("total-intermitentes")) document.getElementById("total-intermitentes").textContent = "0"; 

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
        // CRUZAR UBICACIÓN JERÁRQUICA
        let cadenaUbicacion = "No asignada";
        const espacio = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(activo.id_espacio));
        if (espacio) {
            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            const edificio = nivel ? listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio)) : null;
            cadenaUbicacion = `${edificio ? edificio.nombre : "Edificio Indefinido"} / Piso ${nivel ? nivel.numero_nivel : "?"} / ${espacio.nombre_aula}`;
        }

        // CRUZAR RESPONSABLE DIRECTO (Uso de nombre_completo según el modelo)
        const resp = listaResponsablesGlobal.find(r => Number(r.id_responsable) === Number(activo.id_responsable));
        const nombreResp = resp ? resp.nombre_completo : "Sin asignar";

        // CRUZAR ESTADO DE MONITOREO REAL
        const alertaActiva = listaAlertasGlobal.find(al => al.resuelta === false && Number(al.id_activo) === Number(activo.id_activo));
        const estadoActual = alertaActiva ? "Offline" : "Online";
        const claseEstado = alertaActiva ? "offline" : "online"; 

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><strong>${activo.hostname || 'Sin Nombre'}</strong></td>
            <td>${activo.ip_estatica || 'Sin IP'}</td>
            <td><code>${activo.mac_address || 'N/A'}</code></td>
            <td>${cadenaUbicacion}</td>
            <td>👤 ${nombreResp}</td>
            <td><span class="status-badge ${claseEstado}" style="color: ${alertaActiva ? '#e53e3e' : '#00a650'}; font-weight: bold;">● ${estadoActual}</span></td>
            <td><button class="btn-view" style="background:#005b2e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ver Equipo</button></td>
        `;
        
        fila.querySelector(".btn-view").addEventListener("click", () => {
            navigate_to_device(activo.id_activo);
        });
        
        function navigate_to_device(id) {
            navegarA(`/equipo?id=${id}`);
        }
        
        tabla.appendChild(fila);
    });
}

function ejecutarFiltradoInventario() {
    const texto = document.getElementById("buscar-activo").value.toLowerCase().trim();
    const estadoSel = document.getElementById("filtro-estado-activo").value;

    const activosFiltrados = listaActivosGlobal.filter(activo => {
        // 1. RECALCULAMOS ESTADO
        const tieneAlerta = listaAlertasGlobal.some(al => al.resuelta === false && Number(al.id_activo) === Number(activo.id_activo));
        const estadoReal = tieneAlerta ? "offline" : "online";

        // 2. OBTENEMOS EL NOMBRE DEL RESPONSABLE PARA PODER BUSCARLO
        const resp = listaResponsablesGlobal.find(r => Number(r.id_responsable) === Number(activo.id_responsable));
        const nombreResp = resp ? resp.nombre_completo.toLowerCase() : "sin asignar";

        // 3. SUPER BUSCADOR: Revisamos en equipo, ip, mac y responsable
        const cumpleTexto = !texto || 
            (activo.hostname || "").toLowerCase().includes(texto) || 
            (activo.ip_estatica || "").toLowerCase().includes(texto) ||
            (activo.mac_address || "").toLowerCase().includes(texto) ||
            nombreResp.includes(texto);

        // 4. VERIFICAMOS EL FILTRO SELECT (Online/Offline)
        const cumpleEstado = !estadoSel || estadoReal === estadoSel.toLowerCase();
        
        return cumpleTexto && cumpleEstado;
    });

    renderizarTablaInventario(activosFiltrados);
}

function vincularFiltrosInventario() {
    const btnFiltrar = document.getElementById("btn-filtrar-activo");
    if (btnFiltrar) btnFiltrar.addEventListener("click", ejecutarFiltradoInventario);

    const inputBusqueda = document.getElementById("buscar-activo");
    if (inputBusqueda) inputBusqueda.addEventListener("input", ejecutarFiltradoInventario);
    
    const selectEstado = document.getElementById("filtro-estado-activo");
    if (selectEstado) selectEstado.addEventListener("change", ejecutarFiltradoInventario);
}