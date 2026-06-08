import { get } from './api.js';

async function inicializarInventario() {
    const tbody = document.querySelector("#tabla-inventario tbody");
    if (!tbody) return;

    try {
        const activos = await get('/assets/activos/');
        tbody.innerHTML = "";

        let total = activos.length;
        let online = 0;
        let offline = 0;

        activos.forEach(activo => {
            let estado = "Online";
            let claseBadge = "status-online";
            
            if (!activo.ip_estatica) {
                estado = "Offline";
                claseBadge = "status-offline";
                offline++;
            } else {
                online++;
            }

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><strong>${activo.hostname || 'Sin Hostname'}</strong></td>
                <td><code>${activo.ip_estatica || 'DHCP / Dinámica'}</code></td>
                <td><code>${activo.mac_address}</code></td>
                <td>Espacio Asignado #${activo.id_espacio}</td>
                <td>ID Responsable: ${activo.id_responsable}</td>
                <td><span class="badge ${claseBadge}">${estado}</span></td>
                <td>
                    <button class="btn-action" onclick="window.location.href='aula.html?id=${activo.id_espacio}'">Ver Aula</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        document.getElementById("total-activos").textContent = total;
        document.getElementById("total-online").textContent = online;
        document.getElementById("total-offline").textContent = offline;
        document.getElementById("total-intermitentes").textContent = "0";

    } catch (error) {
        console.error("Error al poblar el inventario:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al conectar con la API de SGATRU</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", inicializarInventario);