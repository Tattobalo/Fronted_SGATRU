(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { post, get } from './api.js';
import { navegarA } from './router.js'; // <-- Importación para SPA

export async function inicializarNuevoActivo() {
    const selectTipo = document.getElementById("tipo_activo");
    if (!selectTipo) return;

    // Vincular lógica de alternancia de campos nativa
    selectTipo.onchange = alternarCamposPorTipo;

    try {
        // Consultar catálogos relacionales de la BD para dar de alta el hardware
        const [switches, espacios, responsables] = await Promise.all([
            get('/network/switches/'),
            get('/locations/espacios/'),
            get('/assets/responsables/')
        ]);

        const selectSw = document.getElementById("id_switch");
        const selectEsp = document.getElementById("id_espacio");
        const selectResp = document.getElementById("id_responsable");

        // Poblar selectores dinámicamente
        selectSw.innerHTML = '<option value="">Selecciona el switch donde se conecta</option>';
        switches.forEach(s => { selectSw.innerHTML += `<option value="${s.id_switch}">${s.nombre_del_equipo || 'Switch'}</option>`; });

        selectEsp.innerHTML = '<option value="">Selecciona el aula destino</option>';
        espacios.forEach(e => { selectEsp.innerHTML += `<option value="${e.id_espacio}">${e.nombre_aula}</option>`; });

        selectResp.innerHTML = '<option value="">Selecciona un usuario responsable</option>';
        responsables.forEach(r => { selectResp.innerHTML += `<option value="${r.id_responsable}">${r.nombre_completo}</option>`; });

    } catch (error) {
        console.error("Error al cargar dependencias de activos:", error);
    }

    // Vincular formulario de envío
    const form = document.getElementById("form-nuevo-activo");
    if (form) {
        form.onsubmit = guardarActivo;
    }
}

function alternarCamposPorTipo() {
    const tipoActivo = document.getElementById("tipo_activo").value;
    
    const grupoMac = document.getElementById("grupo-mac");
    const grupoDatosSwitch = document.getElementById("grupo-datos-switch");
    const grupoDatosPc = document.getElementById("grupo-datos-pc");
    const grupoSwitchUplink = document.getElementById("grupo-switch-uplink");
    const grupoPuertoUplink = document.getElementById("grupo-puerto-uplink");
    const grupoResponsable = document.getElementById("grupo-responsable");

    const inputMac = document.getElementById("mac_address");
    const selectResp = document.getElementById("id_responsable");
    const inputIpGestion = document.getElementById("ip_gestion");

    if (tipoActivo === "Switch") {
        grupoDatosSwitch.style.display = "flex";
        inputIpGestion.required = true;

        grupoMac.style.display = "none";
        grupoDatosPc.style.display = "none";
        grupoSwitchUplink.style.display = "none";
        grupoPuertoUplink.style.display = "none";
        grupoResponsable.style.display = "none";

        inputMac.required = false;
        selectResp.required = false;
    } else if (tipoActivo === "Computadora" || tipoActivo === "Access Point" || tipoActivo === "Servidor") {
        grupoMac.style.display = "flex";
        grupoDatosPc.style.display = "flex";
        grupoSwitchUplink.style.display = "flex";
        grupoPuertoUplink.style.display = "flex";
        grupoResponsable.style.display = "flex";
        
        grupoDatosSwitch.style.display = "none";

        inputMac.required = true;
        selectResp.required = true;
        inputIpGestion.required = false;
    }
}

async function guardarActivo(e) {
    e.preventDefault();

    const tipoActivo = document.getElementById("tipo_activo").value;
    const datosActivo = {
        tipo: tipoActivo,
        hostname: document.getElementById("hostname").value,
        id_espacio: document.getElementById("id_espacio").value,
        id_responsable: document.getElementById("id_responsable").value || null,
        ip_estatica: document.getElementById("ip_estatica").value || null,
        mac_address: document.getElementById("mac_address").value || null,
        puerto_etiqueta: document.getElementById("puerto_etiqueta").value || null,
        id_switch: document.getElementById("id_switch").value || null
    };

    try {
        await post('/assets/activos/', datosActivo);
        alert("¡Activo guardado exitosamente!");
        
        // Regresar al inventario SPA de forma reactiva
        navegarA('/inventario');
    } catch (error) {
        alert("Error al guardar activo: " + error.message);
    }
}