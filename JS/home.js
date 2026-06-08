import { get } from './api.js';

export async function inicializarDashboard() {
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtUsuario = document.getElementById("usuario-topbar");
    if (txtUsuario && datosSesion) {
        txtUsuario.textContent = datosSesion.username;
    }

    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem("sgatru_session");
            // SOLUCIÓN: Ruta absoluta para evitar bucles relacionales de carpetas
            window.location.href = "HTML/login.html";
        });
    }

    try {
        const [activos, switches, alertas, espacios] = await Promise.all([
            get('/assets/activos/'),
            get('/network/switches/'),
            get('/monitoring/alertas/'),
            get('/locations/espacios/')
        ]);

        const totalAlertasCriticas = alertas.filter(al => al.gravedad === "Crítica" || al.estado === "Activa").length;
        const totalSwitches = switches.length;
        const totalOffline = totalAlertasCriticas; 
        const totalOnline = Math.max(0, activos.length - totalOffline);

        const porcentajeMapeado = Math.min(100, Math.round((espacios.length / 5) * 100));

        if (document.getElementById("dash-online")) document.getElementById("dash-online").textContent = totalOnline;
        if (document.getElementById("dash-offline")) document.getElementById("dash-offline").textContent = totalOffline;
        if (document.getElementById("dash-alertas")) document.getElementById("dash-alertas").textContent = alertas.length;
        if (document.getElementById("dash-switches")) document.getElementById("dash-switches").textContent = totalSwitches;
        
        if (document.getElementById("dash-porcentaje-inventario")) document.getElementById("dash-porcentaje-inventario").textContent = `${porcentajeMapeado}%`;
        if (document.getElementById("dash-barra-progreso")) document.getElementById("dash-barra-progreso").style.width = `${porcentajeMapeado}%`;
        
        const statusRedTxt = document.getElementById("dash-status-red");
        if (statusRedTxt) {
            statusRedTxt.textContent = totalOffline > 0 ? "Atención" : "Estable";
            statusRedTxt.className = totalOffline > 0 ? "gold" : "green";
        }

        const contenedorAlertas = document.getElementById("contenedor-alertas-recientes");
        if (contenedorAlertas && alertas.length > 0) {
            contenedorAlertas.innerHTML = "";
            alertas.slice(-3).reverse().forEach(alerta => {
                const divAlerta = document.createElement("div");
                let claseAlerta = alerta.gravedad === "Crítica" ? "red-alert" : (alerta.gravedad === "Advertencia" ? "gold-alert" : "green-alert");
                divAlerta.className = `alert ${claseAlerta}`;
                divAlerta.innerHTML = `<strong>${alerta.tipo_alerta || alerta.mensaje}</strong><p>ID Dispositivo afectado: ${alerta.id_activo || 'Infraestructura'}</p>`;
                contenedorAlertas.appendChild(divAlerta);
            });
        }
    } catch (error) {
        console.error("Error cargando las métricas en tiempo real del Dashboard:", error);
    }
}