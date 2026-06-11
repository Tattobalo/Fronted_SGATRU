(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "login.html"; 
    }
})();

import { get } from './api.js';
import { navegarA, obtenerParametrosHash } from './router.js';

export async function inicializarAula() {

    // ──────────────────────────────────────────────
    // 1. ROL DINÁMICO
    // ──────────────────────────────────────────────
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtRol = document.getElementById("rol-usuario-topbar");
    if (txtRol && datosSesion && datosSesion.rol) {
        txtRol.textContent = datosSesion.rol;
    }

    const params = obtenerParametrosHash();
    let idAula = params.get("id") || params.get("id_espacio"); 

    const contenedorPlano = document.getElementById("mapa-interactivo-aula");
    const tablaCuerpo = document.querySelector("#tabla-detalle-aula tbody");

    try {
        // ──────────────────────────────────────────────
        // 2. DESCARGA PARALELA (Agregamos Edificios y Switches)
        // ──────────────────────────────────────────────
        const [activos, alertas, espacios, niveles, responsables, edificios, switches] = await Promise.all([
            get('/assets/activos/').catch(() => []),
            get('/monitoring/alertas/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/locations/niveles/').catch(() => []),
            get('/assets/responsables/').catch(() => []),
            get('/locations/edificios/').catch(() => []),
            get('/network/switches/').catch(() => [])
        ]);

        // ──────────────────────────────────────────────
        // 3. ENCABEZADOS DINÁMICOS
        // ──────────────────────────────────────────────
        let aulaActual = espacios.find(e => Number(e.id_espacio) === Number(idAula));

        if (!aulaActual && espacios.length > 0) {
            aulaActual = espacios[0];
            idAula = aulaActual.id_espacio;
        }

        if (aulaActual) {
            document.getElementById("nombre-aula").textContent = aulaActual.nombre_aula;
            
            const nivelActual = niveles.find(n => Number(n.id_nivel) === Number(aulaActual.id_nivel));
            
            // Lógica para obtener el nombre real del edificio
            const edificioActual = nivelActual ? edificios.find(ed => Number(ed.id_edificio) === Number(nivelActual.id_edificio)) : null;
            const nombreEdificio = edificioActual ? edificioActual.nombre : "Edificio ?";

            // Inyección del texto jerárquico 100% dinámico
            document.getElementById("ubicacion-jerarquia").textContent = `${nombreEdificio} · Piso ${nivelActual ? nivelActual.numero_nivel : '-'} · Monitoreo ICMP Activo`;
        } else {
            console.warn("No hay espacios registrados en la base de datos.");
            return; 
        }

        // ──────────────────────────────────────────────
        // 4. LÓGICA DE ESTADOS Y DIBUJADO DE MAPA
        // ──────────────────────────────────────────────
        const activosDelAula = activos.filter(a => Number(a.id_espacio) === Number(idAula));
        const switchesDelAula = switches.filter(s => Number(s.id_espacio) === Number(idAula));
        
        let conteoOnline = 0;
        let conteoOffline = 0;

        if (contenedorPlano) {
            contenedorPlano.innerHTML = "";
            contenedorPlano.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 120px)); gap: 20px; padding: 25px; justify-content: center;";
        }
        if (tablaCuerpo) tablaCuerpo.innerHTML = "";

        // Unificamos Activos y Switches en una sola lista para dibujarlos juntos en el aula
        const todosLosEquipos = [
            ...switchesDelAula.map(s => ({ ...s, es_switch: true, hostname: s.nombre_del_equipo, ip_estatica: s.ip_gestion, id_unico: s.id_switch })),
            ...activosDelAula.map(a => ({ ...a, es_switch: false, id_unico: a.id_activo }))
        ];

        todosLosEquipos.forEach(equipo => {
            // Evaluamos si el equipo tiene alguna alerta activa (resuelta === false)
            const alertaActiva = alertas.find(al => al.resuelta === false && Number(al.id_activo) === Number(equipo.id_unico));
            
            const estadoActual = alertaActiva ? "Offline" : "Online";
            const colorEstado = estadoActual === "Offline" ? "#e53e3e" : "#48bb78"; 

            if (estadoActual === "Online") conteoOnline++;
            if (estadoActual === "Offline") conteoOffline++;

            // --- A) DIBUJAR EN EL PLANO INTERACTIVO ---
            if (contenedorPlano) {
                const itemPlano = document.createElement("div");
                itemPlano.style.cssText = `background: #f7fafc; border: 2px solid ${colorEstado}; border-radius: 8px; padding: 12px 8px; text-align: center; font-weight: bold; cursor: pointer; transition: transform 0.2s;`;
                
                itemPlano.onmouseenter = () => itemPlano.style.transform = "scale(1.05)";
                itemPlano.onmouseleave = () => itemPlano.style.transform = "scale(1)";

                itemPlano.innerHTML = `
                    <div style="font-size: 26px; margin-bottom: 5px;">${equipo.es_switch ? "🎛️" : "🖥️"}</div>
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em;" title="${equipo.hostname || 'Equipo'}">${equipo.hostname || 'Equipo'}</div>
                    <div style="font-size: 11px; color: ${colorEstado}; margin-top: 4px;">● ${estadoActual}</div>
                `;

                // Redirige al detalle del equipo al hacer clic
                itemPlano.addEventListener("click", () => navegarA(`/equipo?id=${equipo.id_unico}`));
                contenedorPlano.appendChild(itemPlano);
            }

            // --- B) LLENAR LA TABLA DE DETALLES ---
            if (tablaCuerpo) {
                const tr = document.createElement("tr");
                
                const responsableObj = equipo.id_responsable ? responsables.find(r => Number(r.id_responsable) === Number(equipo.id_responsable)) : null;
                const nombreResponsable = responsableObj ? responsableObj.nombre_completo : "No asignado";

                tr.innerHTML = `
                    <td><strong>${equipo.hostname || 'Sin Nombre'}</strong></td>
                    <td>${equipo.ip_estatica || (equipo.es_switch ? "No administrable" : "DHCP")}</td>
                    <td><code>${equipo.mac_address || "N/A"}</code></td>
                    <td>${equipo.es_switch ? "Infraestructura TI" : nombreResponsable}</td>
                    <td>${equipo.puerto_switch ? `Puerto ${equipo.puerto_switch}` : "N/A"}</td>
                    <td style="color: ${colorEstado}; font-weight: bold;">● ${estadoActual}</td>
                `;
                tablaCuerpo.appendChild(tr);
            }
        });

        // ──────────────────────────────────────────────
        // 5. ACTUALIZAR TARJETAS SUPERIORES (SUMMARY)
        // ──────────────────────────────────────────────
        document.getElementById("aula-total-equipos").textContent = todosLosEquipos.length;
        document.getElementById("aula-equipos-online").textContent = conteoOnline;
        document.getElementById("aula-equipos-offline").textContent = conteoOffline;
        document.getElementById("aula-equipos-warning").textContent = "0";

    } catch (error) {
        console.error("Error general en el módulo de aula:", error);
    }
}