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
    const contenedorDistribucion = document.getElementById("contenedor-pisos") || document.getElementById("Distribucion-infraestructura") || document.querySelector(".main-content section:last-of-type p");

    const params = obtenerParametrosHash();

    const idEdificio =
        params.get("id") || "4";

    let edificios = [], niveles = [], espacios = [], activos = [], alertas = [];

    try {
        edificios = await get('locations/edificios/').catch(() => []);
        niveles = await get('locations/niveles/').catch(() => []);
        espacios = await get('locations/espacios/').catch(() => []);
        activos = await get('assets/activos/').catch(() => []);
        alertas = await get('monitoring/alertas/').catch(() => []);

        if (niveles.length === 0) {
            console.warn("API inactiva o error de red. Usando datos locales para no romper la vista.");
            niveles = [{ id_nivel: 10, id_edificio: idEdificio, numero_nivel: 1 }];
            espacios = [{ id_espacio: 3, id_nivel: 10, nombre_aula: "Zaibuzai" }];
            activos = [];
            alertas = [];
        }

        const edificioActual = edificios.find(e => Number(e.id_edificio) === Number(idEdificio));
        if (edificioActual && document.getElementById("nombre-edificio")) {
            document.getElementById("nombre-edificio").textContent = edificioActual.nombre;
        }
        console.log("ID edificio:", idEdificio);
        console.log("Niveles:", niveles);

        const nivelesDelEdificio = niveles.filter(
            n => Number(n.id_edificio) === Number(idEdificio)
        );

        console.log("Niveles filtrados:", nivelesDelEdificio)
        const idsNiveles = nivelesDelEdificio.map(n => n.id_nivel);

        const espaciosDelEdificio = espacios.filter(e => idsNiveles.includes(e.id_nivel));
        const idsEspacios = espaciosDelEdificio.map(e => e.id_espacio);

        const activosDelEdificio = activos.filter(a => idsEspacios.includes(a.id_espacio));
        const alertasDelEdificio = alertas.filter(al => idsEspacios.includes(al.id_espacio) || activosDelEdificio.map(act => act.id_activo).includes(al.id_activo));

        const tarjetaPisos = document.getElementById("stat-pisos") || document.querySelector(".summary-card:nth-child(1) p, .card:nth-child(1) .number");
        const tarjetaAulas = document.getElementById("stat-aulas") || document.querySelector(".summary-card:nth-child(2) p, .card:nth-child(2) .number");
        const tarjetaActivos = document.getElementById("stat-activos") || document.querySelector(".summary-card:nth-child(3) p, .card:nth-child(3) .number");
        const tarjetaAlertas = document.getElementById("stat-alertas") || document.querySelector(".summary-card:nth-child(4) p, .card:nth-child(4) .number");

        if (tarjetaPisos) tarjetaPisos.textContent = nivelesDelEdificio.length;
        if (tarjetaAulas) tarjetaAulas.textContent = espaciosDelEdificio.length;
        if (tarjetaActivos) tarjetaActivos.textContent = activosDelEdificio.length;
        if (tarjetaAlertas) tarjetaAlertas.textContent = alertasDelEdificio.length;

        if (contenedorDistribucion) {
            contenedorDistribucion.innerHTML = "";

            if (nivelesDelEdificio.length === 0) {
                contenedorDistribucion.innerHTML = `<p style="color:#666; font-style:italic;">Este edificio no tiene niveles registrados.</p>`;
                return;
            }

            nivelesDelEdificio
                .sort((a, b) => b.numero_nivel - a.numero_nivel)
                .forEach((nivel, index) => {

                    const espaciosNivel = espacios.filter(
                        e => Number(e.id_nivel) === Number(nivel.id_nivel)
                    );

                    const idsEspaciosNivel = espaciosNivel.map(e => e.id_espacio);

                    const activosNivel = activos.filter(
                        a => idsEspaciosNivel.includes(a.id_espacio)
                    );

                    const card = document.createElement("div");

                    card.className = "floor-card";

                    card.innerHTML = `
                    <h3>Piso ${nivel.numero_nivel}</h3>

                    <span class="status online">
                        ● Operativo
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