(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { navegarA, obtenerParametrosHash } from './router.js';

export async function inicializarAula() {

    const params = obtenerParametrosHash();

    const idAula =
        params.get("id") ||
        params.get("id_espacio") ||
        "3";

    const contenedorPlano = document.getElementById("mapa-interactivo-aula");

    let activos = [], alertas = [], espacios = [], niveles = [];

    try {
        activos = await get('assets/activos/').catch(() => []);
        alertas = await get('monitoring/alertas/').catch(() => []);
        espacios = await get('locations/espacios/').catch(() => []);
        niveles = await get('locations/niveles/').catch(() => []);

        if (activos.length === 0) {
            console.warn("API inactiva. Cargando topología simulada para el Aula " + idAula);
            activos = [
                { id_activo: 1, id_espacio: idAula, hostname: "PC-01", tipo: "Computadora", ip_estatica: "192.168.3.10", mac_address: "00:1A:2B:3C:4D:5E", estado_operativo: "Online" },
                { id_activo: 2, id_espacio: idAula, hostname: "PC-02", tipo: "Computadora", ip_estatica: "192.168.3.11", mac_address: "00:1A:2B:3C:4D:5F", estado_operativo: "Online" },
                { id_activo: 3, id_espacio: idAula, hostname: "PC-03", tipo: "Computadora", ip_estatica: "192.168.3.12", mac_address: "00:1A:2B:3C:4D:60", estado_operativo: "Intermitente" },
                { id_activo: 4, id_espacio: idAula, hostname: "PC-04", tipo: "Computadora", ip_estatica: "192.168.3.13", mac_address: "00:1A:2B:3C:4D:61", estado_operativo: "Offline" },
                { id_activo: 5, id_espacio: idAula, hostname: "Switch-Laboratorio", tipo: "Switch", ip_estatica: "192.168.3.2", mac_address: "00:1A:2B:3C:4D:62", estado_operativo: "Online" }
            ];
            espacios = [{ id_espacio: idAula, id_nivel: 2, nombre_aula: "Laboratorio de Cómputo 3" }];
            niveles = [{ id_nivel: 2, numero_nivel: 1 }];
        }

        const aulaActual = espacios.find(e => Number(e.id_espacio) === Number(idAula));
        if (aulaActual) {
            document.getElementById("nombre-aula").textContent = aulaActual.nombre_aula;
            const nivelActual = niveles.find(n => Number(n.id_nivel) === Number(aulaActual.id_nivel));
            document.getElementById("ubicacion-jerarquia").textContent = `Edificio A · Piso ${nivelActual ? nivelActual.numero_nivel : '-'} · Monitoreo ICMP Activo`;
        }

        const activosDelAula = activos.filter(a => Number(a.id_espacio) === Number(idAula));
        const dnsOnline = activosDelAula.filter(a => (a.estado_operativo || a.estado || "Online") === "Online");
        const dnsOffline = activosDelAula.filter(a => (a.estado_operativo || a.estado) === "Offline");
        const dnsWarning = activosDelAula.filter(a => (a.estado_operativo || a.estado) === "Intermitente");

        document.getElementById("aula-total-equipos").textContent = activosDelAula.length;
        document.getElementById("aula-equipos-online").textContent = dnsOnline.length;
        document.getElementById("aula-equipos-offline").textContent = dnsOffline.length;
        document.getElementById("aula-equipos-warning").textContent = dnsWarning.length;

        if (contenedorPlano) {
            contenedorPlano.innerHTML = "";
            contenedorPlano.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 120px)); gap: 20px; padding: 25px; justify-content: center;";

            activosDelAula.forEach(activo => {
                const itemPlano = document.createElement("div");
                const estadoActual = activo.estado_operativo || activo.estado || "Online";
                let colorBorde = estadoActual === "Offline" ? "#e53e3e" : (estadoActual === "Intermitente" ? "#ecc94b" : "#48bb78");

                itemPlano.style.cssText = `background: #f7fafc; border: 2px solid ${colorBorde}; border-radius: 8px; padding: 12px 8px; text-align: center; font-weight: bold; cursor: pointer;`;
                itemPlano.innerHTML = `
                    <div style="font-size: 26px; margin-bottom: 5px;">${activo.tipo === "Switch" ? "🎛️" : "🖥️"}</div>
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activo.hostname}</div>
                    <div style="font-size: 11px; color: ${colorBorde}; margin-top: 4px;">● ${estadoActual}</div>
                `;

                itemPlano.addEventListener("click", () => navegarA(`/equipo?id=${activo.id_activo}`));
                contenedorPlano.appendChild(itemPlano);
            });
        }
    } catch (error) {
        console.error("Error general en el módulo de aula:", error);
    }
}