(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "login.html"; 
    }
})();

import { get,post } from './api.js';
import { navegarA } from './router.js';

let listaAlertasGlobal = [];
let listaActivosGlobal = [];
let listaEspaciosGlobal = [];
let listaNivelesGlobal = [];
let listaEdificiosGlobal = [];

export async function cargarAlertas() {
    // 1. ROL DINÁMICO (Opcional si tienes la cabecera)
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtRol = document.getElementById("rol-usuario-topbar");
    if (txtRol && datosSesion && datosSesion.rol) {
        txtRol.textContent = datosSesion.rol;
    }

    const grid = document.getElementById("contenedor-tarjetas-alertas");
    if (!grid) return;

    try {
        // 2. DESCARGA MASIVA PARA CRUZAR DATOS (Evita el error 404 del /resumen/)
        const [alertas, activos, espacios, niveles, edificios] = await Promise.all([
            get('/monitoring/alertas/').catch(() => []),
            get('/assets/activos/').catch(() => []),
            get('/locations/espacios/').catch(() => []),
            get('/locations/niveles/').catch(() => []),
            get('/locations/edificios/').catch(() => [])
        ]);

        listaAlertasGlobal = alertas;
        listaActivosGlobal = activos;
        listaEspaciosGlobal = espacios;
        listaNivelesGlobal = niveles;
        listaEdificiosGlobal = edificios;

        // 3. CÁLCULO DE ESTADÍSTICAS
        let criticas = 0, advertencias = 0, resueltas = 0;

        listaAlertasGlobal.forEach(al => {
            if (al.resuelta) {
                resueltas++;
            } else {
                // Si tienes un campo gravedad úsalo, sino asumimos Crítica por defecto
                const gravedad = al.gravedad || al.severidad || "Crítica";
                if (gravedad === "Advertencia") advertencias++;
                else criticas++;
            }
        });

        if (document.getElementById("alertas-criticas")) document.getElementById("alertas-criticas").textContent = criticas;
        if (document.getElementById("alertas-advertencias")) document.getElementById("alertas-advertencias").textContent = advertencias;
        if (document.getElementById("alertas-resueltas")) document.getElementById("alertas-resueltas").textContent = resueltas;
        if (document.getElementById("alertas-totales")) document.getElementById("alertas-totales").textContent = listaAlertasGlobal.length;

        // 4. DIBUJAR TARJETAS
        renderizarTarjetasAlertas(listaAlertasGlobal);
        vincularFiltrosAlertas();
        vincularEventos();

    } catch (error) {
        console.error("Error al procesar alertas de red:", error);
        grid.innerHTML = `<p style="color:#e53e3e; font-weight:bold;">Error de conexión con el servicio de monitoreo en tiempo real (FastAPI).</p>`;
    }
}

function vincularEventos() {
    // 1. LÓGICA DEL BOTÓN ESCANEO
    const btnEscaneo = document.getElementById("btn-ejecutar-escaneo");
    if (btnEscaneo) {
        btnEscaneo.addEventListener("click", async () => {
            btnEscaneo.textContent = "Escaneando...";
            btnEscaneo.disabled = true;
            try {
                await post('/monitoring/escanear-ahora', {});
                alert("Escaneo iniciado. Los datos se actualizarán en breve.");
                setTimeout(cargarAlertas, 2000);
            } catch (err) {
                console.error("DETALLE DEL ERROR:", err); // <--- MIRA ESTO EN LA CONSOLA
                alert("Error técnico: " + err.message);
            } finally {
                btnEscaneo.textContent = "Ejecutar escaneo";
                btnEscaneo.disabled = false;
            }
        });
    }
}

function renderizarTarjetasAlertas(alertasLista) {
    const grid = document.getElementById("contenedor-tarjetas-alertas");
    if (!grid) return;
    grid.innerHTML = "";

    if (alertasLista.length === 0) {
        grid.innerHTML = `<p style="color: #718096; font-style: italic; padding: 20px;">No se encontraron alertas con los filtros actuales.</p>`;
        return;
    }

    // Ordenamos para que las NO resueltas salgan primero, y luego por fecha
    alertasLista.sort((a, b) => (a.resuelta === b.resuelta) ? 0 : a.resuelta ? 1 : -1).forEach(alerta => {
        
        // --- CRUCE DE DATOS ---
        const activo = listaActivosGlobal.find(act => Number(act.id_activo) === Number(alerta.id_activo)) || {};
        let cadenaUbicacion = "Ubicación desconocida";
        
        const espacio = listaEspaciosGlobal.find(e => Number(e.id_espacio) === Number(activo.id_espacio));
        if (espacio) {
            const nivel = listaNivelesGlobal.find(n => Number(n.id_nivel) === Number(espacio.id_nivel));
            const edificio = nivel ? listaEdificiosGlobal.find(ed => Number(ed.id_edificio) === Number(nivel.id_edificio)) : null;
            cadenaUbicacion = `${edificio ? edificio.nombre : "Edificio ?"} / Piso ${nivel ? nivel.numero_nivel : "?"} / ${espacio.nombre_aula}`;
        }

        // --- LÓGICA DE DISEÑO (Colores y Textos) ---
        const esResuelta = alerta.resuelta;
        const severidad = alerta.gravedad || alerta.severidad || "Crítica";
        
        let colorBorde = "#00a650"; // Verde (Resuelta)
        let colorPillBg = "#e6f4ea";
        let colorPillText = "#00a650";
        let textoSeveridad = "Resuelta";

        if (!esResuelta) {
            if (severidad === "Advertencia") {
                colorBorde = "#ecc94b"; // Dorado
                colorPillBg = "#fefcbf";
                colorPillText = "#b7791f";
                textoSeveridad = "Advertencia";
            } else {
                colorBorde = "#e53e3e"; // Rojo
                colorPillBg = "#fed7d7";
                colorPillText = "#c53030";
                textoSeveridad = "Crítica";
            }
        }

        // Título y Descripción dinámicos
        const titulo = alerta.tipo_incidencia || alerta.tipo_incidente || "Falla de red detectada";
        const desc = alerta.descripcion || `El equipo ${activo.hostname || 'desconocido'} no responde a las pruebas de conectividad mediante ping.`;
        
        // Formateo de fecha
        const fechaDetectada = alerta.timestamp || alerta.fecha_hora;
        const fechaFormateada = fechaDetectada ? new Date(fechaDetectada).toLocaleString('es-MX', {dateStyle: 'short', timeStyle: 'short'}) : "Fecha desconocida";

        // --- CONSTRUCCIÓN DE LA TARJETA ---
        const card = document.createElement("div");
        card.style.cssText = `border-left: 5px solid ${colorBorde}; border-radius: 8px; padding: 20px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; flex-direction: column;`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #005b2e; font-size: 1.2em;">${titulo}</h3>
                <span style="background: ${colorPillBg}; color: ${colorPillText}; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold;">${textoSeveridad}</span>
            </div>
            
            <p style="color: #4a5568; margin-bottom: 15px; font-size: 0.95em;">${desc}</p>
            
            <div style="background: #f7fafc; padding: 15px; border-radius: 6px; font-size: 0.9em; color: #2d3748; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0;"><strong>Equipo:</strong> ${activo.hostname || 'N/A'}</p>
                <p style="margin: 0 0 8px 0;"><strong>IP:</strong> ${activo.ip_estatica || 'N/A'}</p>
                <p style="margin: 0 0 8px 0;"><strong>Ubicación:</strong> ${cadenaUbicacion}</p>
                <p style="margin: 0;"><strong>Detectada:</strong> ${fechaFormateada}</p>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: auto;">
                <button class="btn-ver" style="background: #00563b; color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; flex: 1;">Ver equipo</button>
                ${!esResuelta ? `<button class="btn-resolver" style="background: #d4af37; color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; flex: 1;">Marcar en revisión</button>` : ''}
            </div>
        `;

        // Lógica de botones
        card.querySelector('.btn-ver').addEventListener("click", () => navegarA(`/equipo?id=${activo.id_activo}`));
        
        const btnResolver = card.querySelector('.btn-resolver');
        if (btnResolver) {
            btnResolver.addEventListener("click", () => {
                alert(`Lógica para resolver la alerta #${alerta.id_alerta} en desarrollo.`);
                // Aquí podrías hacer un PUT a FastAPI para cambiar resuelta a true
            });
        }

        grid.appendChild(card);
    });
}

function vincularFiltrosAlertas() {
    // Usa los IDs exactos de tu HTML
    const btnFiltrar = document.getElementById("btn-filtrar-alertas");
    const inputBusqueda = document.getElementById("buscar-alerta");
    const selectSeveridad = document.getElementById("filtro-severidad");
    const selectEstado = document.getElementById("filtro-estado-alerta");

    const ejecutarFiltro = () => {
        const texto = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";
        const severidadFiltro = selectSeveridad ? selectSeveridad.value : "";
        const estadoFiltro = selectEstado ? selectEstado.value : "activas";

        const filtradas = listaAlertasGlobal.filter(alerta => {
            const activo = listaActivosGlobal.find(a => Number(a.id_activo) === Number(alerta.id_activo)) || {};
            const severidad = alerta.gravedad || alerta.severidad || "Critica";
            
            const cumpleTexto = !texto || 
                (activo.hostname || "").toLowerCase().includes(texto) || 
                (activo.ip_estatica || "").toLowerCase().includes(texto) ||
                (alerta.tipo_incidencia || alerta.tipo_incidente || "").toLowerCase().includes(texto);
            
            const cumpleSeveridad = !severidadFiltro || severidad === severidadFiltro;
            
            // Lógica lógica de estado según los valores de tu <select>
            let cumpleEstado = true;
            if (estadoFiltro === "activas") cumpleEstado = !alerta.resuelta;
            else if (estadoFiltro === "resueltas") cumpleEstado = alerta.resuelta;

            return cumpleTexto && cumpleSeveridad && cumpleEstado;
        });

        renderizarTarjetasAlertas(filtradas);
    };

    if (btnFiltrar) btnFiltrar.addEventListener("click", ejecutarFiltro);
    // Agregamos listeners también a los selects para que filtren al instante
    if (inputBusqueda) inputBusqueda.addEventListener("input", ejecutarFiltro);
    if (selectSeveridad) selectSeveridad.addEventListener("change", ejecutarFiltro);
    if (selectEstado) selectEstado.addEventListener("change", ejecutarFiltro);
}