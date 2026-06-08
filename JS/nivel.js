// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { navegarA } from './router.js'; // Importación necesaria para el enrutamiento SPA

export async function inicializarMapaNivel() {
    const mapaContainer = document.getElementById("contenedor-mapa-aulas");
    if (!mapaContainer) return;

    const params = new URLSearchParams(window.location.search);
    const idNivel = params.get("id_nivel") || "2";

    try {
        // 1. Obtener la información del Backend
        const niveles = await get('/locations/niveles/');
        const espacios = await get('/locations/espacios/');
        const switches = await get('/network/switches/');
        const activos = await get('/assets/activos/');

        // --- BLOQUE DE AUDITORÍA (MIRA ESTO EN TU CONSOLA F12) ---
        console.log("=== AUDITORÍA DE DATOS SGATRU ===");
        console.log("ID Nivel Buscado desde URL:", idNivel);
        console.log("Espacios de la BD:", espacios);
        console.log("Activos de la BD:", activos);
        // --------------------------------------------------------

        const nivelActual = niveles.find(n => n.id_nivel == idNivel);
        if (nivelActual) {
            document.getElementById("texto-encabezado-piso").textContent = `Edificio A - Piso ${nivelActual.numero_nivel}`;
        }

        const espaciosDelNivel = espacios.filter(e => e.id_nivel == idNivel);

        mapaContainer.innerHTML = "";

        if (espaciosDelNivel.length === 0) {
            mapaContainer.innerHTML = `<p style="text-align: center; color: #fff; font-style: italic; width: 100%; padding: 20px;">No hay aulas mapeadas en este piso.</p>`;
            return;
        }

        let totalSwitchesPiso = 0;
        let totalActivosPiso = 0;

        espaciosDelNivel.forEach((espacio, index) => {
            // CORRECCIÓN DE FILTRADO SEGURO (Nivelando tipos de datos String vs Int)
            const switchesEnSalon = switches.filter(s => Number(s.id_espacio) === Number(espacio.id_espacio)).length;
            
            // Evaluamos tanto 'id_espacio' (tu modelo) como posibles variaciones de nombres
            const activosEnSalon = activos.filter(a => {
                const idActivoEspacio = a.id_espacio || a.espacio_id;
                return Number(idActivoEspacio) === Number(espacio.id_espacio);
            }).length;

            totalSwitchesPiso += switchesEnSalon;
            totalActivosPiso += activosEnSalon;

            const card = document.createElement("div");
            card.className = `room room-${(index % 4) + 1}`;

            let textoActivos = `${activosEnSalon} activos`;
            if (espacio.tipo_espacio === "Cuarto de Red") {
                textoActivos = `${switchesEnSalon} switches`;
            }

            card.innerHTML = `
                <h3>${espacio.nombre_aula}</h3>
                <span class="online">● Operativo</span>
                <p>${textoActivos}</p>
                <button class="btn-view-aula" style="display: inline-block; background: #005b2e; color: white; border: none; padding: 9px 14px; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold;">Ver aula</button>
            `;

            // Interceptamos el clic para navegar dentro de la SPA sin recargar
            card.querySelector('.btn-view-aula').addEventListener('click', () => {
                navegarA(`/aula?id=${espacio.id_espacio}`);
            });

            mapaContainer.appendChild(card);
        });

        // Poblar el cuadro analítico superior
        document.getElementById("stat-piso-aulas").textContent = espaciosDelNivel.length;
        document.getElementById("stat-piso-activos").textContent = totalActivosPiso;
        document.getElementById("stat-piso-switches").textContent = totalSwitchesPiso;
        document.getElementById("stat-piso-alertas").textContent = "0";

    } catch (error) {
        console.error("Error al procesar el layout:", error);
    }
}