// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { obtenerParametrosHash } from './router.js';

// Exportamos la función para que el enrutador la ejecute tras renderizar el DOM virtual
export async function inicializarDetalleEquipo() {

    const params = obtenerParametrosHash();

    const idActivo =
        params.get("id") ||
        params.get("id_activo") ||
        "2";

    // Inicializamos las variables de datos vacías incorporando 'edificios'
    let activos = [], responsables = [], espacios = [], niveles = [], edificios = [], conexiones = [], switches = [], alertas = [];

    try {
        // 1. Consultar únicamente los endpoints existentes y activos en tu FastAPI
        activos = await get('/assets/activos/');
        responsables = await get('/assets/responsables/');
        espacios = await get('/locations/espacios/');
        niveles = await get('/locations/niveles/');
        edificios = await get('/locations/edificios/'); // <-- Traemos el catálogo de edificios
        conexiones = await get('/network/conexion_puerto/');
        switches = await get('/network/switches/');
        alertas = await get('/monitoring/alertas/');

    } catch (networkError) {
        console.warn("NetworkError: Servidor o túnel inaccesible. Cargando paracaídas de datos locales de desarrollo...");

        // PARACAÍDAS LOCAL: Datos de prueba ajustados a tu BD de PostgreSQL
        activos = [{
            id_activo: idActivo,
            hostname: "paquito",
            ip_estatica: "192.168.1.50",
            mac_address: "00:1A:2B:3C:4D:5E",
            id_responsable: 2,
            id_espacio: 3
        }];
        responsables = [{
            id_responsable: 2,
            nombre_completo: "Karen",
            correo: "karen@gmail.com",
            telefono: "7222222221"
        }];
        espacios = [{ id_espacio: 3, id_nivel: 2, nombre_aula: "Zaibuzai" }];
        niveles = [{ id_nivel: 2, id_edificio: 4, numero_nivel: 1 }];
        edificios = [{ id_edificio: 4, nombre: "Edificio AA" }]; // Estructura corregida
        conexiones = [{ id_activo: idActivo, id_switch: 1, puerto_etiqueta: "Gi1/0/24" }];
        switches = [{ id_switch: 1, nombre_del_equipo: "Cisco Catalyst 9200" }];
        alertas = [];
    }

    try {
        // 2. Localizar el activo por su ID numérico
        const activoActual = activos.find(a => Number(a.id_activo) === Number(idActivo));
        if (!activoActual) {
            document.getElementById("eq-titulo-hostname").textContent = "Activo No Encontrado";
            return;
        }

        // 3. Inyectar Campos de Red Reales de la tabla 'activos'
        document.getElementById("eq-titulo-hostname").textContent = activoActual.hostname;
        document.getElementById("eq-det-hostname").textContent = activoActual.hostname;

        const ipReal = activoActual.ip_estatica || "DHCP (Dinámica)";
        document.getElementById("eq-quick-ip").textContent = ipReal;
        document.getElementById("eq-det-ip").textContent = ipReal;

        document.getElementById("eq-quick-mac").textContent = activoActual.mac_address;
        document.getElementById("eq-det-mac").textContent = activoActual.mac_address;

        // 4. Inyectar Campos Reales de la tabla 'responsables' (id_responsable)
        const responsable = responsables.find(r => Number(r.id_responsable) === Number(activoActual.id_responsable));
        if (responsable) {
            document.getElementById("eq-resp-nombre").textContent = responsable.nombre_completo;
            document.getElementById("eq-resp-correo").textContent = responsable.correo || "Sin correo registrado";
            document.getElementById("eq-resp-telefono").textContent = responsable.telefono || "Sin teléfono";

            // Iniciales dinámicas para el círculo estético del avatar
            const iniciales = responsable.nombre_completo.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            document.getElementById("eq-resp-avatar").textContent = iniciales;
        } else {
            document.getElementById("eq-resp-nombre").textContent = "No asignado";
            document.getElementById("eq-resp-avatar").textContent = "NA";
        }

        // =========================================================================
        // 5. INYECTAR UBICACIÓN ARQUITECTÓNICA DINÁMICA (CORREGIDO)
        // =========================================================================
        const espacio = espacios.find(e => Number(e.id_espacio) === Number(activoActual.id_espacio));
        let nombreAula = "No mapeada";
        let numeroPiso = "-";
        let nombreEdificio = "Edificio Desconocido";

        if (espacio) {
            nombreAula = espacio.nombre_aula;
            // Inyectamos dinámicamente en el panel el nombre del Espacio/Aula
            document.getElementById("eq-det-espacio").textContent = espacio.nombre_aula;

            const nivel = niveles.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            if (nivel) {
                numeroPiso = nivel.numero_nivel;
                // Inyectamos dinámicamente en el panel el número de Piso
                document.getElementById("eq-det-piso").textContent = `Piso ${nivel.numero_nivel}`;

                // Buscamos el edificio usando la propiedad real de tu BD '.nombre'
                const edificioActual = edificios.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio));
                if (edificioActual) {
                    nombreEdificio = edificioActual.nombre; // Traerá "Edificio AA" de tu PostgreSQL
                }
            }
        }

        // NUEVO: Inyectamos los nombres reales calculados dentro de las IDs de tu panel de Ubicación Física
        if (document.getElementById("eq-det-edificio")) {
            document.getElementById("eq-det-edificio").textContent = nombreEdificio;
        }
        if (document.getElementById("eq-det-campus")) {
            // Como tu proyecto está centralizado en tu centro universitario, lo mapeamos dinámicamente
            document.getElementById("eq-det-campus").textContent = "CU Tianguistenco";
        }

        // Actualizamos el subtítulo superior de la Topbar con los datos reales de la BD
        document.getElementById("eq-ubicacion-subtitulo").textContent = `${nombreEdificio} · Piso ${numeroPiso} · ${nombreAula}`;

        // 6. Inyectar Campos Reales de Enlace de Red (conexiones_puerto -> switches)
        const conexion = conexiones.find(c => Number(c.id_activo) === Number(idActivo));
        if (conexion) {
            const sw = switches.find(s => Number(s.id_switch) === Number(conexion.id_switch));
            const nombreSwitch = sw ? sw.nombre_del_equipo : "Switch General";

            document.getElementById("eq-quick-puerto").textContent = `${nombreSwitch} / ${conexion.puerto_etiqueta}`;
            document.getElementById("eq-det-switch").textContent = nombreSwitch;
            document.getElementById("eq-det-puertonombre").textContent = `Puerto ${conexion.puerto_etiqueta}`;
        } else {
            document.getElementById("eq-quick-puerto").textContent = "Sin cablear";
            document.getElementById("eq-det-switch").textContent = "Desconectado";
            document.getElementById("eq-det-puertonombre").textContent = "Ninguno";
        }

        // 7. Sincronizar Estado Lógico Dinámico y Alertas Receptadas
        const alertasDelActivo = alertas.filter(al => Number(al.id_activo) === Number(idActivo));
        const badgeEstado = document.getElementById("eq-badge-estado");
        const contenedorAlertas = document.getElementById("contenedor-alertas-equipo");
        const contenedorTimeline = document.getElementById("contenedor-timeline-equipo");

        const alertasActivas = alertasDelActivo.filter(al => al.resuelta === false);
        const tieneAlertasActivas = alertasActivas.length > 0;

        if (tieneAlertasActivas) {
            badgeEstado.textContent = "● Offline";
            badgeEstado.className = "status offline";
            if (badgeEstado.style) badgeEstado.style.color = "#e53e3e"; // Forzar color rojo visualmente si es necesario
        } else {
            badgeEstado.textContent = "● Online";
            badgeEstado.className = "status online";
            if (badgeEstado.style) badgeEstado.style.color = "#48bb78"; // Verde estable
        }

        // Renderizar caja de alertas de tu base de datos
        if (contenedorAlertas) {
            contenedorAlertas.innerHTML = "";
            if (alertasDelActivo.length === 0) {
                contenedorAlertas.innerHTML = `
                    <div class="alert green-alert">
                        <strong>✓ Sin incidentes</strong>
                        <p>No hay anomalías de topología registradas en este puerto.</p>
                    </div>
                `;
            } else {
                alertasDelActivo.forEach(al => {
                    const claseAlerta = al.gravedad === "Crítica" ? "red-alert" : "warning-alert";
                    const divAl = document.createElement("div");
                    divAl.className = `alert ${claseAlerta}`;
                    divAl.innerHTML = `
                        <strong>⚠ ${al.tipo_alerta || 'Alerta de Red'}</strong>
                        <p>${al.mensaje || 'Comportamiento registrado en escaneo.'}</p>
                    `;
                    contenedorAlertas.appendChild(divAl);
                });
            }
        }

        // Generar historial de la línea de tiempo basado en datos reales
        if (contenedorTimeline) {
            contenedorTimeline.innerHTML = "";
            if (alertasDelActivo.length === 0) {
                contenedorTimeline.innerHTML = `
                    <div class="timeline-item online-line">
                        <strong>Estado Estable</strong>
                        <p>El nodo no presenta caídas ni pérdida de paquetes concurrentes.</p>
                    </div>
                `;
            } else {
                alertasDelActivo.slice(-3).forEach(al => {
                    const item = document.createElement("div");
                    const claseLinea = al.gravedad === "Crítica" ? "warning-line" : "online-line";
                    const fecha = al.fecha_hora ? new Date(al.fecha_hora).toLocaleString('es-MX') : "Reciente";

                    item.className = `timeline-item ${claseLinea}`;
                    item.innerHTML = `
                        <strong>${fecha}</strong>
                        <p>${al.tipo_alerta || 'Escaneo rutinario completo'}</p>
                    `;
                    contenedorTimeline.appendChild(item);
                });
            }
        }

        // =========================================================================
        // 8. GENERACIÓN DEL REPORTE DEL EQUIPO (NUEVO)
        // =========================================================================
        const btnReporteEquipo = document.querySelector(".report-btn");
        if (btnReporteEquipo) {
            // Clonamos el botón para remover cualquier listener previo si se cambia de vista en la SPA
            const nuevoBtn = btnReporteEquipo.cloneNode(true);
            btnReporteEquipo.replaceWith(nuevoBtn);

            nuevoBtn.addEventListener("click", () => {
                const fechaReporte = new Date().toLocaleDateString('es-MX');
                const horaReporte = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                const usuarioSesion = localStorage.getItem("sgatru_session") 
                    ? JSON.parse(localStorage.getItem("sgatru_session")).username 
                    : "Sistema";

                // Capturar el estado lógico visual actual
                const estadoActual = badgeEstado.textContent.includes("Online") ? "● Online" : "● Offline";
                const claseEstado = badgeEstado.textContent.includes("Online") ? "badge-ok" : "badge-err";

                // Construcción de la tabla de alertas/incidencias en formato HTML para el PDF
                let tablaAlertasHTML = "";
                if (alertasDelActivo.length === 0) {
                    tablaAlertasHTML = `<p style="color: #005b2e; font-style: italic;">✓ El dispositivo no cuenta con alertas o incidencias vigentes en la base de datos.</p>`;
                } else {
                    let filasAlertas = alertasDelActivo.map(al => `
                        <tr>
                            <td>${al.tipo_alerta || 'Alerta de Red'}</td>
                            <td>${al.mensaje || 'Registrado en escaneo rutinario.'}</td>
                            <td>${al.fecha_hora ? new Date(al.fecha_hora).toLocaleString('es-MX') : 'Reciente'}</td>
                            <td><span class="${al.resuelta ? 'badge-ok' : 'badge-err'}">${al.resuelta ? 'Resuelta' : 'Activa'}</span></td>
                        </tr>
                    `).join("");

                    tablaAlertasHTML = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo de Incidencia</th>
                                    <th>Mensaje / Comportamiento</th>
                                    <th>Fecha y Hora</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filasAlertas}
                            </tbody>
                        </table>
                    `;
                }

                // Abrir ventana limpia de impresión
                const ventanaImpresion = window.open("", "_blank");
                ventanaImpresion.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>Reporte Técnico - ${activoActual.hostname}</title>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                            .header-reporte { border-bottom: 3px solid #d4af37; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                            h1 { color: #005b2e; margin: 0; font-size: 28px; }
                            .meta-reporte { text-align: right; font-size: 0.9em; color: #555; }
                            h2 { color: #005b2e; border-left: 5px solid #d4af37; padding-left: 10px; margin-top: 30px; font-size: 20px; }
                            .grid-datos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
                            .dato-item { background: #f7faf7; padding: 12px 18px; border-radius: 8px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
                            .dato-item span { color: #666; font-weight: 500; }
                            .dato-item strong { color: #1a1a1a; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9em; }
                            th { background: #005b2e; color: white; padding: 12px; text-align: left; }
                            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
                            tr:nth-child(even) td { background: #f9fbf9; }
                            .badge-ok { color: #0e9f4b; font-weight: bold; }
                            .badge-err { color: #e53e3e; font-weight: bold; }
                            .footer-firma { margin-top: 60px; padding-top: 20px; border-top: 1px dashed #ccc; text-align: center; font-size: 0.85em; color: #777; }
                            @media print { button { display: none; } }
                        </style>
                    </head>
                    <body>
                        <div class="header-reporte">
                            <div>
                                <h1>SGATRU — Reporte Individual de Activo</h1>
                                <p style="margin: 5px 0 0 0; color: #666;">Auditoría e infraestructura de red universitaria</p>
                            </div>
                            <div class="meta-reporte">
                                <strong>Fecha:</strong> ${fechaReporte}<br>
                                <strong>Hora:</strong> ${horaReporte}<br>
                                <strong>Auditor:</strong> ${usuarioSesion}
                            </div>
                        </div>

                        <h2>Información de Red y Conectividad</h2>
                        <div class="grid-datos">
                            <div class="dato-item"><span>Hostname:</span> <strong>${activoActual.hostname}</strong></div>
                            <div class="dato-item"><span>Dirección IP:</span> <strong>${ipReal}</strong></div>
                            <div class="dato-item"><span>Dirección MAC:</span> <strong><code>${activoActual.mac_address}</code></strong></div>
                            <div class="dato-item"><span>Estado en Red:</span> <strong class="${claseEstado}">${estadoActual}</strong></div>
                            <div class="dato-item"><span>Switch de Gestión:</span> <strong>${conexion ? (switches.find(s => Number(s.id_switch) === Number(conexion.id_switch))?.nombre_del_equipo || 'Switch General') : 'Desconectado'}</strong></div>
                            <div class="dato-item"><span>Puerto Físico:</span> <strong>${conexion ? conexion.puerto_etiqueta : 'Ninguno'}</strong></div>
                        </div>

                        <h2>Ubicación Física e Institucional</h2>
                        <div class="grid-datos">
                            <div class="dato-item"><span>Campus:</span> <strong>CU Tianguistenco</strong></div>
                            <div class="dato-item"><span>Edificio:</span> <strong>${nombreEdificio}</strong></div>
                            <div class="dato-item"><span>Piso / Nivel:</span> <strong>${numeroPiso !== '-' ? 'Piso ' + numeroPiso : '-'}</strong></div>
                            <div class="dato-item"><span>Aula / Laboratorio:</span> <strong>${nombreAula}</strong></div>
                        </div>

                        <h2>Responsable Asignado</h2>
                        <div class="grid-datos">
                            <div class="dato-item"><span>Nombre Completo:</span> <strong>${responsable ? responsable.nombre_completo : 'No asignado'}</strong></div>
                            <div class="dato-item"><span>Correo Electrónico:</span> <strong>${responsable ? (responsable.correo || 'Sin registrar') : '-'}</strong></div>
                            <div class="dato-item"><span>Teléfono de Contacto:</span> <strong>${responsable ? (responsable.telefono || 'Sin registrar') : '-'}</strong></div>
                            <div class="dato-item"><span>Cargo / Rol:</span> <strong>${responsable ? (responsable.cargo || 'Personal Escolar') : '-'}</strong></div>
                        </div>

                        <h2>Historial de Alertas e Incidencias</h2>
                        ${tablaAlertasHTML}

                        <div class="footer-firma">
                            <p>Documento generado analíticamente por el Sistema de Gestión de Activos y Topología de Red Universitaria (SGATRU).</p>
                            <p style="margin-top: 5px;">© ${new Date().getFullYear()} Universidad Autónoma del Estado de México</p>
                        </div>

                        <script>
                            window.onload = () => { 
                                window.print(); 
                                setTimeout(() => { window.close(); }, 500);
                            }
                        <\/script>
                    </body>
                    </html>
                `);
                ventanaImpresion.document.close();
            });
        }

    } catch (error) {
        console.error("Error al poblar la auditoría limpia del dispositivo:", error);
    }
}