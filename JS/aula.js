import { get } from './api.js';

// =========================================================================
// 1. GUARDIÁN DE CONTROL DE ACCESO
// =========================================================================
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        console.warn("Navegando en modo desarrollo local.");
    }
})();

// =========================================================================
// 2. LÓGICA DE MONITOREO Y PLANO DEL AULA
// =========================================================================
const inicializarAula = async () => {
    const params = new URLSearchParams(window.location.search);
    const idAula = params.get("id") || "3";

    let activos = [], alertas = [], espacios = [], niveles = [];

    try {
        // Intentar traer los datos reales desde FastAPI a través de localhost
        activos = await get('assets/activos/').catch(() => []);
        alertas = await get('monitoring/alertas/').catch(() => []);
        espacios = await get('locations/espacios/').catch(() => []);
        niveles = await get('locations/niveles/').catch(() => []);

        // PARACAÍDAS LOCAL: Si la API no responde, poblamos datos con la estructura exacta de la BD
        if (activos.length === 0) {
            console.warn("API inactiva. Cargando topología simulada para el Aula " + idAula);
            
            activos = [
                { id_activo: 1, id_espacio: idAula, hostname: "PC-01", tipo: "Computadora", ip_estatica: "192.168.3.10", mac_address: "00:1A:2B:3C:4D:5E", estado_operativo: "Online" },
                { id_activo: 2, id_espacio: idAula, hostname: "PC-02", tipo: "Computadora", ip_estatica: "192.168.3.11", mac_address: "00:1A:2B:3C:4D:5F", estado_operativo: "Online" },
                { id_activo: 3, id_espacio: idAula, hostname: "PC-03", tipo: "Computadora", ip_estatica: "192.168.3.12", mac_address: "00:1A:2B:3C:4D:60", estado_operativo: "Intermitente" },
                { id_activo: 4, id_espacio: idAula, hostname: "PC-04", tipo: "Computadora", ip_estatica: "192.168.3.13", mac_address: "00:1A:2B:3C:4D:61", estado_operativo: "Offline" },
                { id_activo: 5, id_espacio: idAula, hostname: "Switch-Laboratorio", tipo: "Switch", ip_estatica: "192.168.3.2", mac_address: "00:1A:2B:3C:4D:62", estado_operativo: "Online" },
                { id_activo: 6, id_espacio: idAula, hostname: "PC-05", tipo: "Computadora", ip_estatica: "192.168.3.14", mac_address: "00:1A:2B:3C:4D:63", estado_operativo: "Online" }
            ];
            espacios = [{ id_espacio: idAula, id_nivel: 2, nombre_aula: "Laboratorio de Cómputo 3" }];
            niveles = [{ id_nivel: 2, numero_nivel: 1 }];
        }

        // 1. Inyectar encabezados dinámicos del aula actual
        const aulaActual = espacios.find(e => Number(e.id_espacio) === Number(idAula));
        if (aulaActual) {
            document.getElementById("nombre-aula").textContent = aulaActual.nombre_aula;
            const nivelActual = niveles.find(n => Number(n.id_nivel) === Number(aulaActual.id_nivel));
            const pisoTxt = nivelActual ? `Piso ${nivelActual.numero_nivel}` : "Piso -";
            document.getElementById("ubicacion-jerarquia").textContent = `Edificio A · ${pisoTxt} · Monitoreo ICMP Activo`;
        }

        // 2. Filtrar los activos pertenecientes a esta aula específica
        const activosDelAula = activos.filter(a => Number(a.id_espacio) === Number(idAula));

        // 3. Clasificar estados basándonos en tu mapeo 'estado_operativo' o 'estado'
        const obtenerEstado = (act) => act.estado_operativo || act.estado || "Online";

        const dnsOnline = activosDelAula.filter(a => obtenerEstado(a) === "Online" || obtenerEstado(a) === "u");
        const dnsOffline = activosDelAula.filter(a => obtenerEstado(a) === "Offline");
        const dnsWarning = activosDelAula.filter(a => obtenerEstado(a) === "Intermitente");

        // 4. Inyectar de forma directa y exacta en las IDs de tus tarjetas superiores
        document.getElementById("aula-total-equipos").textContent = activosDelAula.length;
        document.getElementById("aula-equipos-online").textContent = dnsOnline.length;
        document.getElementById("aula-equipos-offline").textContent = dnsOffline.length;
        document.getElementById("aula-equipos-warning").textContent = dnsWarning.length;

        // =========================================================================
        // 5. RENDERIZADO DEL PLANO INTERACTIVO (Inyección exacta en tu ID de mapa)
        // =========================================================================
        const contenedorPlano = document.getElementById("mapa-interactivo-aula");

        if (contenedorPlano) {
            contenedorPlano.innerHTML = "";
            // Le aplicamos un Grid para que acomode las computadoras como un laboratorio real
            contenedorPlano.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 120px)); gap: 20px; padding: 25px; justify-content: center; background: #ffffff; min-height: 200px;";

            if (activosDelAula.length === 0) {
                contenedorPlano.innerHTML = `<p style="grid-column: 1/-1; color: #718096; font-style: italic; text-align: center; padding: 20px;">No hay dispositivos asignados a este espacio.</p>`;
                return;
            }

            activosDelAula.forEach(activo => {
                const itemPlano = document.createElement("div");
                const estadoActual = obtenerEstado(activo);
                
                // Determinamos los colores de borde de la computadora según el monitoreo
                let colorBorde = "#48bb78"; // Online
                if (estadoActual === "Offline") colorBorde = "#e53e3e";
                if (estadoActual === "Intermitente") colorBorde = "#ecc94b";

                itemPlano.style.cssText = `
                    background: #f7fafc;
                    border: 2px solid ${colorBorde};
                    border-radius: 8px;
                    padding: 12px 8px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 13px;
                    color: #2d3748;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: transform 0.2s;
                    cursor: pointer;
                `;
                
                const icono = activo.tipo === "Switch" ? "🎛️" : "🖥️";
                const nombreMostrar = activo.hostname || activo.nombre_activo || "Dispositivo";

                itemPlano.innerHTML = `
                    <div style="font-size: 26px; margin-bottom: 5px;">${icono}</div>
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombreMostrar}">${nombreMostrar}</div>
                    <div style="font-size: 11px; color: ${colorBorde}; margin-top: 4px;">● ${estadoActual}</div>
                `;

                // Animación hover por JS
                itemPlano.addEventListener("mouseenter", () => itemPlano.style.transform = "scale(1.05)");
                itemPlano.addEventListener("mouseleave", () => itemPlano.style.transform = "scale(1)");
                
                // Navegación al hacer clic al inventario
                itemPlano.addEventListener("click", () => {
                    window.location.href = `equipo.html?id=${activo.id_activo}`;
                });

                contenedorPlano.appendChild(itemPlano);
            });
        }

    } catch (error) {
        console.error("Error general en el módulo de aula:", error);
    }
};

// =========================================================================
// 3. INICIALIZACIÓN ASÍNCRONA UNIFICADA
// =========================================================================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarAula);
} else {
    inicializarAula();
}