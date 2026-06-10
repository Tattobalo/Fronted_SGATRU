// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js'; // Importación necesaria para el enrutamiento SPA
import { navegarA, obtenerParametrosHash } from './router.js';

export async function inicializarMapaNivel() {

    // 1. LÓGICA DE ROL DINÁMICO
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtRol = document.getElementById("rol-usuario-topbar");
    if (txtRol && datosSesion && datosSesion.rol) {
        txtRol.textContent = datosSesion.rol;
    }

    const mapaContainer = document.getElementById("contenedor-mapa-aulas");
    if (!mapaContainer) return;

    const params = obtenerParametrosHash();

    let idNivel =
        params.get("id") ||
        params.get("id_nivel");

    try {
        // 2. OBTENER INFORMACIÓN DEL BACKEND (Agregamos alertas y edificios)
        const [niveles, espacios, switches, activos, alertas, edificios] = await Promise.all([
            get('/locations/niveles/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/network/switches/').catch(() => []),
            get('/assets/activos/').catch(() => []),
            get('/monitoring/alertas/').catch(() => []),
            get('/locations/edificios/').catch(() => [])
        ]);

        const nivelDefault =
            niveles.find(n => n.numero_nivel === 1) ||
            niveles[0];

        if (!idNivel && nivelDefault) {
            idNivel = nivelDefault.id_nivel;
        }

        // 3. NOMBRE DE EDIFICIO DINÁMICO
        const nivelActual = niveles.find(n => n.id_nivel == idNivel);
        if (nivelActual) {
            const edificioDelNivel = edificios.find(e => e.id_edificio == nivelActual.id_edificio);
            const nombreEdificio = edificioDelNivel ? edificioDelNivel.nombre : "Edificio Desconocido";
            
            document.getElementById("texto-encabezado-piso").textContent = `${nombreEdificio} - Piso ${nivelActual.numero_nivel}`;
        }

        const espaciosDelNivel = espacios.filter(e => e.id_nivel == idNivel);

        mapaContainer.innerHTML = "";

        if (espaciosDelNivel.length === 0) {
            mapaContainer.innerHTML = `<p style="text-align: center; color: #fff; font-style: italic; width: 100%; padding: 20px;">No hay aulas mapeadas en este piso.</p>`;
            return;
        }

        let totalSwitchesPiso = 0;
        let totalActivosPiso = 0;
        let totalAlertasPiso = 0;

        espaciosDelNivel.forEach((espacio, index) => {
            const switchesEnSalon = switches.filter(s => Number(s.id_espacio) === Number(espacio.id_espacio)).length;

            const activosEnSalonFiltro = activos.filter(a => {
                const idActivoEspacio = a.id_espacio || a.espacio_id;
                return Number(idActivoEspacio) === Number(espacio.id_espacio);
            });
            const activosEnSalon = activosEnSalonFiltro.length;

            totalSwitchesPiso += switchesEnSalon;
            totalActivosPiso += activosEnSalon;

            // 4. LÓGICA DE COLOR Y ALERTAS POR AULA
            const idsActivosSalon = activosEnSalonFiltro.map(a => Number(a.id_activo));
            const alertasSalon = alertas.filter(al => al.resuelta === false && idsActivosSalon.includes(Number(al.id_activo)));
            
            totalAlertasPiso += alertasSalon.length;

            let textoEstado = "● Operativo";
            let colorPunto = "color: #00a650;"; // Verde por defecto

            if (alertasSalon.length > 0) {
                textoEstado = "● Con alertas";
                colorPunto = "color: #d4af37;"; // Dorado/Amarillo si hay fallas
            }

            let textoActivos = `${activosEnSalon} activos`;
            if (espacio.tipo_espacio === "Cuarto de Red") {
                textoActivos = `${switchesEnSalon} switches`;
            }

            const card = document.createElement("div");
            card.className = `room room-${(index % 4) + 1}`;

            // Tarjeta limpia, sin botones, con color dinámico
            card.innerHTML = `
            <h3>${espacio.nombre_aula}</h3>
            <span style="${colorPunto} font-weight: 600;">${textoEstado}</span>
            <p>${textoActivos}</p>
            `;

            card.style.cursor = "pointer";

            card.addEventListener("click", () => {
                navegarA(`/aula?id=${espacio.id_espacio}`);
            });

            mapaContainer.appendChild(card);
        });

        // Poblar el cuadro analítico superior
        document.getElementById("stat-piso-aulas").textContent = espaciosDelNivel.length;
        document.getElementById("stat-piso-activos").textContent = totalActivosPiso;
        document.getElementById("stat-piso-switches").textContent = totalSwitchesPiso;
        document.getElementById("stat-piso-alertas").textContent = totalAlertasPiso;

    } catch (error) {
        console.error("Error al procesar el layout:", error);
    }
}