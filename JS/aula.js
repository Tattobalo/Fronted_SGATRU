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
    const idAula = params.get("id") || params.get("id_espacio");

    const contenedorPlano = document.getElementById("mapa-interactivo-aula");
    const tablaCuerpo = document.querySelector("#tabla-detalle-aula tbody");

    try {
        // ──────────────────────────────────────────────
        // 2. DESCARGA PARALELA DE DATOS (Incluyendo Responsables)
        // ──────────────────────────────────────────────
        const [activos, alertas, espacios, niveles, responsables] = await Promise.all([
            get('/assets/activos/').catch(() => []),
            get('/monitoring/alertas/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/locations/niveles/').catch(() => []),
            get('/assets/responsables/').catch(() => []) // <-- Necesario para la tabla
        ]);

        // ──────────────────────────────────────────────
        // 3. ENCABEZADOS Y JERARQUÍA
        // ──────────────────────────────────────────────
        const aulaActual = espacios.find(e => Number(e.id_espacio) === Number(idAula));
        if (aulaActual) {
            document.getElementById("nombre-aula").textContent = aulaActual.nombre_aula;
            const nivelActual = niveles.find(n => Number(n.id_nivel) === Number(aulaActual.id_nivel));
            document.getElementById("ubicacion-jerarquia").textContent = `Edificio A · Piso ${nivelActual ? nivelActual.numero_nivel : '-'} · Monitoreo ICMP Activo`;
        } else {
            console.warn("No se encontró el aula con ID:", idAula);
            return;
        }

        // ──────────────────────────────────────────────
        // 4. LÓGICA DE ESTADOS Y ALERTAS
        // ──────────────────────────────────────────────
        const activosDelAula = activos.filter(a => Number(a.id_espacio) === Number(idAula));
        
        let conteoOnline = 0;
        let conteoOffline = 0;

        // Limpiamos los contenedores visuales
        if (contenedorPlano) contenedorPlano.innerHTML = "";
        if (tablaCuerpo) tablaCuerpo.innerHTML = "";

        // Estilos del grid
        if (contenedorPlano) {
            contenedorPlano.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 120px)); gap: 20px; padding: 25px; justify-content: center;";
        }

        activosDelAula.forEach(activo => {
            // Buscamos si este equipo específico tiene una alerta sin resolver
            const alertaActiva = alertas.find(al => al.resuelta === false && Number(al.id_activo) === Number(activo.id_activo));
            
            // Determinamos el estado real basado en la base de datos
            const estadoActual = alertaActiva ? "Offline" : "Online";
            const colorEstado = estadoActual === "Offline" ? "#e53e3e" : "#48bb78"; // Rojo o Verde

            if (estadoActual === "Online") conteoOnline++;
            if (estadoActual === "Offline") conteoOffline++;

            // --- A) DIBUJAR EN EL PLANO ---
            if (contenedorPlano) {
                const itemPlano = document.createElement("div");
                itemPlano.style.cssText = `background: #f7fafc; border: 2px solid ${colorEstado}; border-radius: 8px; padding: 12px 8px; text-align: center; font-weight: bold; cursor: pointer; transition: transform 0.2s;`;
                
                itemPlano.onmouseenter = () => itemPlano.style.transform = "scale(1.05)";
                itemPlano.onmouseleave = () => itemPlano.style.transform = "scale(1)";

                itemPlano.innerHTML = `
                    <div style="font-size: 26px; margin-bottom: 5px;">${activo.tipo === "Switch" ? "🎛️" : "🖥️"}</div>
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${activo.hostname}">${activo.hostname}</div>
                    <div style="font-size: 11px; color: ${colorEstado}; margin-top: 4px;">● ${estadoActual}</div>
                `;

                itemPlano.addEventListener("click", () => navegarA(`/equipo?id=${activo.id_activo}`));
                contenedorPlano.appendChild(itemPlano);
            }

            // --- B) LLENAR LA TABLA DE DETALLES ---
            if (tablaCuerpo) {
                const tr = document.createElement("tr");
                
                const responsableObj = responsables.find(r => Number(r.id_responsable) === Number(activo.id_responsable));
                
                const nombreResponsable = responsableObj ? responsableObj.nombre_completo : "No asignado";

                tr.innerHTML = `
                    <td><strong>${activo.hostname}</strong></td>
                    <td>${activo.ip_estatica || "DHCP"}</td>
                    <td>${activo.mac_address || "No registrada"}</td>
                    <td>${nombreResponsable}</td>
                    <td>${activo.puerto_switch ? `Puerto ${activo.puerto_switch}` : "N/A"}</td>
                    <td style="color: ${colorEstado}; font-weight: bold;">● ${estadoActual}</td>
                `;
                tablaCuerpo.appendChild(tr);
            }
        });

        // ──────────────────────────────────────────────
        // 5. ACTUALIZAR TARJETAS SUPERIORES (SUMMARY)
        // ──────────────────────────────────────────────
        document.getElementById("aula-total-equipos").textContent = activosDelAula.length;
        document.getElementById("aula-equipos-online").textContent = conteoOnline;
        document.getElementById("aula-equipos-offline").textContent = conteoOffline;
        // Asignamos 0 a intermitentes por ahora, ya que el motor solo maneja Activo/Caído (True/False)
        document.getElementById("aula-equipos-warning").textContent = "0";

    } catch (error) {
        console.error("Error general en el módulo de aula:", error);
    }
}