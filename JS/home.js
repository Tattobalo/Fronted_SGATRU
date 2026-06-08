// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html";
    }
})();

import { get } from './api.js';

async function inicializarDashboard() {
    // A. Mostrar el operador real que inició sesión en la barra superior
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtUsuario = document.getElementById("usuario-topbar");
    if (txtUsuario && datosSesion) {
        txtUsuario.textContent = datosSesion.username;
    }

    // B. Funcionalidad al botón de Cerrar Sesión original
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            localStorage.removeItem("sgatru_session"); // Borrar credenciales de la memoria
            window.location.href = "../login.html";       // Rebotar al login
        });
    }

    try {
        // C. Consultar datos en paralelo de tus endpoints de FastAPI
        const activos = await get('/assets/activos/');
        const switches = await get('/network/switches/');
        const alertas = await get('/monitoring/alertas/');
        const espacios = await get('/locations/espacios/');

        // D. Lógica de cálculo analítico de red
        // Separamos equipos online basados en si cuentan con IP Estática activa (o alertas pendientes)
        const totalAlertasCriticas = alertas.filter(al => al.gravedad === "Crítica" || al.estado === "Activa").length;
        const totalSwitches = switches.length;
        
        // Simulación lógica para separar online/offline basada en tus datos reales
        const totalOffline = totalAlertasCriticas; 
        const totalOnline = Math.max(0, activos.length - totalOffline);

        // Calcular el porcentaje de avance del inventario mapeado
        const totalEspaciosEsperados = 5; // Constante objetivo de diseño de tu campus
        const porcentajeMapeado = Math.min(100, Math.round((espacios.length / totalEspaciosEsperados) * 100));

        // E. Inyectar valores numéricos sin tocar el diseño de tus tarjetas
        document.getElementById("dash-online").textContent = totalOnline;
        document.getElementById("dash-offline").textContent = totalOffline;
        document.getElementById("dash-alertas").textContent = alertas.length;
        document.getElementById("dash-switches").textContent = totalSwitches;
        
        // F. Modificar el panel de estado general de la red
        document.getElementById("dash-porcentaje-inventario").textContent = `${porcentajeMapeado}%`;
        document.getElementById("dash-barra-progreso").style.width = `${porcentajeMapeado}%`;
        
        const statusRedTxt = document.getElementById("dash-status-red");
        if (totalOffline > 0) {
            statusRedTxt.textContent = "Atención";
            statusRedTxt.className = "gold";
        } else {
            statusRedTxt.textContent = "Estable";
            statusRedTxt.className = "green";
        }

        // G. Renderizar alertas dinámicas en tu contenedor de avisos recientes
        const contenedorAlertas = document.getElementById("contenedor-alertas-recientes");
        if (contenedorAlertas && alertas.length > 0) {
            contenedorAlertas.innerHTML = ""; // Limpiar las estáticas solo si hay reales en la base de datos
            
            // Tomamos las últimas 3 alertas registradas para no desbordar el panel
            alertas.slice(-3).reverse().forEach(alerta => {
                const divAlerta = document.createElement("div");
                
                // Mapear tus clases nativas CSS según la severidad de la alerta
                let claseAlerta = "green-alert";
                if (alerta.gravedad === "Crítica") claseAlerta = "red-alert";
                if (alerta.gravedad === "Advertencia") claseAlerta = "gold-alert";

                divAlerta.className = `alert ${claseAlerta}`;
                divAlerta.innerHTML = `
                    <strong>${alerta.tipo_alerta || alerta.mensaje}</strong>
                    <p>ID Dispositivo afectado: ${alerta.id_activo || 'Infraestructura'}</p>
                `;
                contenedorAlertas.appendChild(divAlerta);
            });
        }

    } catch (error) {
        console.error("Error cargando las métricas en tiempo real del Dashboard:", error);
    }
}

document.addEventListener("DOMContentLoaded", inicializarDashboard);