(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "login.html"; // Redirige al login de inmediato
    }
})();

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
            window.location.href = "HTML/login.html";
        });
    }

    try {
        const [activos, switches, alertas, espacios, dataEscaneo] = await Promise.all([
            get('/assets/activos/'),
            get('/network/switches/'),
            get('/monitoring/alertas/'),
            get('/locations/espacios/'),
            get('/monitoring/historial/ultimo-escaneo')
        ]);

        const alertasActivas = alertas.filter(al => al.resuelta === false);
        const totalOffline = alertasActivas.length;

        const totalSwitches = switches.length;
        const totalOnline = Math.max(0, activos.length - totalOffline);

        const porcentajeMapeado = Math.min(100, Math.round((espacios.length / 5) * 100));

        if (document.getElementById("dash-online")) document.getElementById("dash-online").textContent = totalOnline;
        if (document.getElementById("dash-offline")) document.getElementById("dash-offline").textContent = totalOffline;

        if (document.getElementById("dash-alertas")) document.getElementById("dash-alertas").textContent = alertasActivas.length;

        if (document.getElementById("dash-switches")) document.getElementById("dash-switches").textContent = totalSwitches;

        if (document.getElementById("dash-porcentaje-inventario")) document.getElementById("dash-porcentaje-inventario").textContent = `${porcentajeMapeado}%`;
        if (document.getElementById("dash-barra-progreso")) document.getElementById("dash-barra-progreso").style.width = `${porcentajeMapeado}%`;

        const txtUltimoEscaneo = document.getElementById("dash-ultimo-escaneo"); // Asegúrate de que tu HTML tenga este ID en el texto

        if (txtUltimoEscaneo) {
            if (dataEscaneo && dataEscaneo.ultimo_escaneo) {
                // Convertimos la fecha del servidor a un objeto Date de JS
                const fechaEscaneo = new Date(dataEscaneo.ultimo_escaneo);
                const ahora = new Date();

                // Calculamos la diferencia en milisegundos y la pasamos a minutos
                const diferenciaMs = ahora - fechaEscaneo;
                const minutosPasados = Math.floor(diferenciaMs / 60000);

                if (minutosPasados < 1) {
                    txtUltimoEscaneo.textContent = "Hace unos instantes";
                } else if (minutosPasados === 1) {
                    txtUltimoEscaneo.textContent = "Hace 1 minuto";
                } else {
                    txtUltimoEscaneo.textContent = `Hace ${minutosPasados} minutos`;
                }
            } else {
                txtUltimoEscaneo.textContent = "Sin datos de escaneo";
            }
        }

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

                let claseAlerta = alerta.resuelta === false ? "red-alert" : "green-alert";
                divAlerta.className = `alert ${claseAlerta}`;

                divAlerta.innerHTML = `
                    <strong>${alerta.tipo_incidencia}</strong>
                    <p>ID Dispositivo afectado: ${alerta.id_activo}</p>
                `;

                contenedorAlertas.appendChild(divAlerta);
            });
        }
    } catch (error) {
        console.error("Error cargando las métricas en tiempo real del Dashboard:", error);
    }
}