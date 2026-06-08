// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';

export async function cargarAlertas() {
    const grid = document.getElementById("contenedor-tarjetas-alertas");
    if (!grid) return;

    try {
        // 1. Obtener contadores resumidos
        const resumen = await get('/monitoring/alertas/resumen/');
        document.getElementById("alertas-criticas").textContent = resumen.criticas;
        document.getElementById("alertas-advertencias").textContent = resumen.advertencias;
        document.getElementById("alertas-resueltas").textContent = resumen.resueltas;
        document.getElementById("alertas-totales").textContent = resumen.totales;

        // 2. Obtener lista completa de incidencias
        const alertas = await get('/monitoring/alertas/');
        grid.innerHTML = ""; // Limpiar cargador

        if (alertas.length === 0) {
            grid.innerHTML = `<p class="no-alerts">No se detectaron anomalías ni caídas de nodos en los switches del campus.</p>`;
            return;
        }

        alertas.forEach(alerta => {
            const card = document.createElement("div");
            card.className = `alert-card ${alerta.severidad.toLowerCase()}`;
            
            const fecha = new Date(alerta.fecha_hora).toLocaleString('es-MX');

            card.innerHTML = `
                <div class="alert-header">
                    <span class="severity-tag">${alerta.severidad}</span>
                    <span class="alert-time">${fecha}</span>
                </div>
                <div class="alert-body">
                    <h3>${alerta.tipo_incidente}</h3>
                    <p>${alerta.descripcion}</p>
                    <small>ID Activo Afectado: <code>#${alerta.id_activo}</code></small>
                </div>
                <div class="alert-footer">
                    <span>Estado: <strong>${alerta.estado}</strong></span>
                    ${alerta.estado === 'Activa' ? `<button class="btn-resolve" data-id="${alerta.id_alerta}">Marcar Solucionada</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error al procesar alertas de red:", error);
        grid.innerHTML = `<p style="color:red;">Error de conexión con el servicio de monitoreo en tiempo real (FastAPI).</p>`;
    }
}

document.addEventListener("DOMContentLoaded", cargarAlertas);