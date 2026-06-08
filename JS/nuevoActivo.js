function alternarCamposPorTipo() {
    const tipoActivo = document.getElementById("tipo_activo").value;
    
    // Traer los contenedores estructurales de la interfaz
    const grupoMac = document.getElementById("grupo-mac");
    const grupoDatosSwitch = document.getElementById("grupo-datos-switch");
    const grupoDatosPc = document.getElementById("grupo-datos-pc");
    const grupoSwitchUplink = document.getElementById("grupo-switch-uplink");
    const grupoPuertoUplink = document.getElementById("grupo-puerto-uplink");
    const grupoResponsable = document.getElementById("grupo-responsable");

    // Inputs para manipular el atributo required
    const inputMac = document.getElementById("mac_address");
    const selectResp = document.getElementById("id_responsable");
    const inputIpGestion = document.getElementById("ip_gestion");

    if (tipoActivo === "Switch") {
        // 1. Mostrar campos específicos de Switch
        grupoDatosSwitch.classList.remove("oculto");
        inputIpGestion.required = true;

        // 2. Ocultar lo que no aplica usando la nueva clase CSS
        grupoMac.classList.add("oculto");
        grupoDatosPc.classList.add("oculto");
        grupoSwitchUplink.classList.add("oculto");
        grupoPuertoUplink.classList.add("oculto");
        grupoResponsable.classList.add("oculto");

        // Quitar obligatoriedad para evitar bloqueos internos del navegador al enviar
        inputMac.required = false;
        selectResp.required = false;

    } else if (tipoActivo === "Computadora" || tipoActivo === "Access Point" || tipoActivo === "Servidor") {
        // 1. Mostrar campos estándar removiendo la clase 'oculto'
        grupoMac.classList.remove("oculto");
        grupoDatosPc.classList.remove("oculto");
        grupoSwitchUplink.classList.remove("oculto");
        grupoPuertoUplink.classList.remove("oculto");
        grupoResponsable.classList.remove("oculto");
        
        // 2. Ocultar campos exclusivos de Switch
        grupoDatosSwitch.classList.add("oculto");

        // Activar validaciones requeridas por el backend en FastAPI
        inputMac.required = true;
        selectResp.required = true;
        inputIpGestion.required = false;
    } else {
        // Si no hay selección válida, ocultamos los bloques condicionales
        grupoMac.classList.add("oculto");
        grupoDatosSwitch.classList.add("oculto");
        grupoDatosPc.classList.add("oculto");
        grupoSwitchUplink.classList.add("oculto");
        grupoPuertoUplink.classList.add("oculto");
        grupoResponsable.classList.add("oculto");
    }
}