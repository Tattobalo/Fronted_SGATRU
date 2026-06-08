import { get } from './api.js';
import { navegarA } from './router.js';

export async function inicializarEdificio() {
    const contenedorDistribucion = document.getElementById("contenedor-pisos") || document.getElementById("Distribucion-infraestructura") || document.querySelector(".main-content section:last-of-type p");
    
    const params = new URLSearchParams(window.location.search);
    const idEdificio = params.get("id") || "4";

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

        const nivelesDelEdificio = niveles.filter(n => Number(n.id_edificio) === Number(idEdificio));
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

            nivelesDelEdificio.sort((a, b) => b.numero_nivel - a.numero_nivel).forEach(nivel => {
                const divNivel = document.createElement("div");
                divNivel.className = "nivel-contenedor";
                divNivel.style.cssText = "background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:15px; border-left:5px solid #005b2e; text-align:left;";
                
                const espaciosDelPiso = espaciosDelEdificio.filter(e => Number(e.id_nivel) === Number(nivel.id_nivel));
                
                const contenedorBotones = document.createElement("div");
                contenedorBotones.style.cssText = "display:flex; flex-wrap:wrap;";

                if (espaciosDelPiso.length === 0) {
                    contenedorBotones.innerHTML = `<span style="color:#888; font-size:13px; font-style:italic;">Sin laboratorios asignados</span>`;
                } else {
                    espaciosDelPiso.forEach(esp => {
                        const btnAula = document.createElement("button");
                        btnAula.style.cssText = "display:inline-block; background:#fff; border:1px solid #ddd; padding:6px 12px; border-radius:6px; margin:5px; color:#333; font-weight:bold; font-size:13px; cursor:pointer;";
                        btnAula.textContent = ` Navarre 🚪 ${esp.nombre_aula}`;
                        
                        btnAula.addEventListener("click", () => {
                            navegarA(`/aula?id=${esp.id_espacio}`);
                        });
                        contenedorBotones.appendChild(btnAula);
                    });
                }

                divNivel.innerHTML = `<strong style="display:block; font-size:16px; color:#005b2e; margin-bottom:10px;">Piso ${nivel.numero_nivel}</strong>`;
                divNivel.appendChild(contenedorBotones);
                contenedorDistribucion.appendChild(divNivel);
            });
        }
    } catch (error) {
        console.error("Error en la topología:", error);
    }
}