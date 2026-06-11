(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { navegarA } from './router.js';
import { obtenerParametrosHash } from './router.js';

export async function inicializarEdificio() {
    
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtRol = document.getElementById("rol-usuario-topbar");
    
    if (txtRol && datosSesion && datosSesion.rol) {
        txtRol.textContent = datosSesion.rol;
    }

    const contenedorDistribucion = document.getElementById("contenedor-pisos") || document.getElementById("Distribucion-infraestructura") || document.querySelector(".main-content section:last-of-type p");

    const params = obtenerParametrosHash();
    let idEdificio = params.get("id"); 

    let edificios = [], niveles = [], espacios = [], activos = [], alertas = [];

    try {
        edificios = await get('locations/edificios/').catch(() => []);
        
        if (!idEdificio) {
            const edificioA = edificios.find(e => e.nombre.trim().toUpperCase() === "EDIFICIO A");
            idEdificio = edificioA ? edificioA.id_edificio : (edificios.length > 0 ? edificios[0].id_edificio : "1");
        }

        niveles = await get('locations/niveles/').catch(() => []);
        espacios = await get('locations/espacios/').catch(() => []);
        activos = await get('assets/activos/').catch(() => []);
        alertas = await get('monitoring/alertas/').catch(() => []);

        if (niveles.length === 0) {
            console.warn("API inactiva o error de red. Usando datos locales.");
            niveles = [{ id_nivel: 10, id_edificio: idEdificio, numero_nivel: 1 }];
            espacios = [{ id_espacio: 3, id_nivel: 10, nombre_aula: "Aula Default" }];
            activos = [];
            alertas = [];
        }

        const edificioActual = edificios.find(e => Number(e.id_edificio) === Number(idEdificio));
        if (edificioActual && document.getElementById("nombre-edificio")) {
            document.getElementById("nombre-edificio").textContent = edificioActual.nombre;
        }

        const nivelesDelEdificio = niveles.filter(n => Number(n.id_edificio) === Number(idEdificio));
        const idsNiveles = nivelesDelEdificio.map(n => n.id_nivel);

        const espaciosDelEdificio = espacios.filter(e => idsNiveles.includes(e.id_nivel));
        const idsEspacios = espaciosDelEdificio.map(e => e.id_espacio);

        const activosDelEdificio = activos.filter(a => idsEspacios.includes(a.id_espacio));
        
        // =====================================================================
        // CORRECCIÓN 1: Filtramos SOLO las alertas no resueltas de este edificio
        // =====================================================================
        const alertasActivasEdificio = alertas.filter(al => 
            al.resuelta === false && 
            (idsEspacios.includes(al.id_espacio) || activosDelEdificio.map(act => act.id_activo).includes(al.id_activo))
        );

        const tarjetaPisos = document.getElementById("stat-pisos");
        const tarjetaAulas = document.getElementById("stat-aulas");
        const tarjetaActivos = document.getElementById("stat-activos");
        const tarjetaAlertas = document.getElementById("stat-alertas");

        if (tarjetaPisos) tarjetaPisos.textContent = nivelesDelEdificio.length;
        if (tarjetaAulas) tarjetaAulas.textContent = espaciosDelEdificio.length;
        if (tarjetaActivos) tarjetaActivos.textContent = activosDelEdificio.length;
        
        // Mostramos las alertas reales activas
        if (tarjetaAlertas) {
            tarjetaAlertas.textContent = alertasActivasEdificio.length;
            tarjetaAlertas.className = alertasActivasEdificio.length > 0 ? "gold" : "green";
        }

        if (contenedorDistribucion) {
            contenedorDistribucion.innerHTML = "";

            if (nivelesDelEdificio.length === 0) {
                contenedorDistribucion.innerHTML = `<p style="color:#666; font-style:italic;">Este edificio no tiene niveles registrados.</p>`;
                return;
            }

            nivelesDelEdificio
                .sort((a, b) => b.numero_nivel - a.numero_nivel)
                .forEach((nivel) => {

                    const espaciosNivel = espacios.filter(e => Number(e.id_nivel) === Number(nivel.id_nivel));
                    const idsEspaciosNivel = espaciosNivel.map(e => e.id_espacio);
                    const activosNivel = activos.filter(a => idsEspaciosNivel.includes(a.id_espacio));
                    const idsActivosNivel = activosNivel.map(a => a.id_activo);

                    // =====================================================================
                    // CORRECCIÓN 2: Lógica dinámica de estado por piso
                    // =====================================================================
                    const alertasDelNivel = alertasActivasEdificio.filter(al => idsActivosNivel.includes(al.id_activo));
                    const hayFalla = alertasDelNivel.length > 0;
                    
                    const estadoTexto = hayFalla ? "● Falla de red" : "● Operativo";
                    // Dependiendo de tu CSS, usamos la clase que pinta rojo/naranja o verde
                    const estadoClase = hayFalla ? "offline" : "online"; 
                    const estadoColorStyle = hayFalla ? "color: #e53e3e;" : "color: #0e9f4b;";

                    const card = document.createElement("div");
                    card.className = "floor-card";
                    card.innerHTML = `
                    <h3>Piso ${nivel.numero_nivel}</h3>

                    <span class="status ${estadoClase}" style="${estadoColorStyle} font-weight:bold; display:inline-block; margin: 10px 0;">
                        ${estadoTexto}
                    </span>

                    <div class="floor-data">
                        <p><strong>Aulas:</strong> ${espaciosNivel.length}</p>
                        <p><strong>Activos:</strong> ${activosNivel.length}</p>
                    </div>
                    `;

                    card.style.cursor = "pointer";
                    card.addEventListener("click", () => {
                        navegarA(`/nivel?id=${nivel.id_nivel}`);
                    });

                    contenedorDistribucion.appendChild(card);
                });
        }
    } catch (error) {
        console.error("Error en la topología:", error);
    }
}