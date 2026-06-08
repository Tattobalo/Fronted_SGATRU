import { get } from './api.js';

// =========================================================================
// 1. GUARDIÁN DE CONTROL DE ACCESO
// =========================================================================
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html";
    }
})();

// =========================================================================
// 2. LÓGICA DE RENDERIZADO FIDEDIGNA A TU INTERFAZ
// =========================================================================
const inicializarEdificio = async () => {
    // Apuntamos estrictamente al elemento de texto original "Cargando distribución de infraestructura..."
    const contenedorDistribucion = document.getElementById("Distribucion-infraestructura") || document.querySelector(".main-content section:last-of-type p");
    
    const params = new URLSearchParams(window.location.search);
    const idEdificio = params.get("id") || "4";

    let edificios = [], niveles = [], espacios = [], activos = [], alertas = [];

    try {
        // Consultas al Backend a través del túnel
        edificios = await get('locations/edificios/').catch(() => []);
        niveles = await get('locations/niveles/').catch(() => []);
        espacios = await get('locations/espacios/').catch(() => []);
        activos = await get('assets/activos/').catch(() => []);
        alertas = await get('monitoring/alertas/').catch(() => []);

        // Paracaídas local si el túnel de FastAPI está caído/congelado
        if (niveles.length === 0) {
            console.warn("API inactiva o error de red. Usando datos locales para no romper la vista.");
            niveles = [{ id_nivel: 10, id_edificio: idEdificio, numero_nivel: 1 }];
            espacios = [
                { id_espacio: 3, id_nivel: 10, nombre_aula: "Zaibuzai" }
            ];
            activos = [];
            alertas = [];
        }

        // Filtrado relacional exacto
        const nivelesDelEdificio = niveles.filter(n => Number(n.id_edificio) === Number(idEdificio));
        const idsNiveles = nivelesDelEdificio.map(n => n.id_nivel);

        const espaciosDelEdificio = espacios.filter(e => idsNiveles.includes(e.id_nivel));
        const idsEspacios = espaciosDelEdificio.map(e => e.id_espacio);

        const activosDelEdificio = activos.filter(a => idsEspacios.includes(a.id_espacio));
        const alertasDelEdificio = alertas.filter(al => idsEspacios.includes(al.id_espacio) || activosDelEdificio.map(act => act.id_activo).includes(al.id_activo));

        // Actualización de las tarjetas numéricas superiores
        const tarjetaPisos = document.querySelector(".summary-card:nth-child(1) p, .card:nth-child(1) .number");
        const tarjetaAulas = document.querySelector(".summary-card:nth-child(2) p, .card:nth-child(2) .number");
        const tarjetaActivos = document.querySelector(".summary-card:nth-child(3) p, .card:nth-child(3) .number");
        const tarjetaAlertas = document.querySelector(".summary-card:nth-child(4) p, .card:nth-child(4) .number");

        if (tarjetaPisos) tarjetaPisos.textContent = nivelesDelEdificio.length;
        if (tarjetaAulas) tarjetaAulas.textContent = espaciosDelEdificio.length;
        if (tarjetaActivos) tarjetaActivos.textContent = activosDelEdificio.length;
        if (tarjetaAlertas) tarjetaAlertas.textContent = alertasDelEdificio.length;

        // Renderizado limpio dentro de tu contenedor original sin duplicar h2
        if (contenedorDistribucion) {
            // Limpiamos el párrafo de carga por completo
            contenedorDistribucion.innerHTML = "";

            if (nivelesDelEdificio.length === 0) {
                contenedorDistribucion.innerHTML = `<p style="color:#666; font-style:italic;">Este edificio no tiene niveles registrados.</p>`;
                return;
            }

            // Inyectamos los pisos respetando tu flujo original de divs
            nivelesDelEdificio.sort((a, b) => b.numero_nivel - a.numero_nivel).forEach(nivel => {
                const divNivel = document.createElement("div");
                divNivel.className = "nivel-contenedor"; // O la clase que maneje tu CSS original
                divNivel.style.cssText = "background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #005b2e; text-align:left;";
                
                const espaciosDelPiso = espaciosDelEdificio.filter(e => Number(e.id_nivel) === Number(nivel.id_nivel));
                let htmlEspacios = "";

                if (espaciosDelPiso.length === 0) {
                    htmlEspacios = `<span style="color:#888; font-size:13px; font-style:italic;">Sin laboratorios asignados</span>`;
                } else {
                    espaciosDelPiso.forEach(esp => {
                        htmlEspacios += `
                            <a href="aula.html?id=${esp.id_espacio}" style="display:inline-block; background:#fff; border:1px solid #ddd; padding:6px 12px; border-radius:6px; margin:5px; color:#333; text-decoration:none; font-weight:bold; font-size:13px;">
                                🚪 ${esp.nombre_aula}
                            </a>`;
                    });
                }

                divNivel.innerHTML = `
                    <strong style="display:block; font-size:16px; color:#005b2e; margin-bottom:10px;">Piso ${nivel.numero_nivel}</strong>
                    <div style="display:flex; flex-wrap:wrap;">${htmlEspacios}</div>
                `;
                contenedorDistribucion.appendChild(divNivel);
            });
        }

    } catch (error) {
        console.error("Error en la topología:", error);
    }
};

// =========================================================================
// 3. EJECUCIÓN SEGURA
// =========================================================================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarEdificio);
} else {
    inicializarEdificio();
}