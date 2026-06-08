import { get } from './api.js';

async function inicializarEdificio() {
    // 1. Obtener el id del edificio desde la URL
    const params = new URLSearchParams(window.location.search);
    const idEdificio = params.get("id");

    if (!idEdificio) {
        document.getElementById("nombre-edificio").textContent = "Edificio no especificado";
        return;
    }

    const contenedorPisos = document.getElementById("contenedor-pisos");

    try {
        // 2. Traer la información específica de este edificio o el catálogo completo para filtrar
        const edificios = await get('/locations/edificios/');
        const edificioActual = edificios.find(e => e.id_edificio == idEdificio);

        if (!edificioActual) {
            document.getElementById("nombre-edificio").textContent = "Edificio no encontrado";
            return;
        }

        // Colocar nombre del edificio en la cabecera
        document.getElementById("nombre-edificio").textContent = edificioActual.nombre;

        // 3. Traer los niveles/pisos asociados a este edificio
        const niveles = await get('/locations/niveles/'); // Cambia el endpoint según tu router de rutas físicas
        const pisosEdificio = niveles.filter(n => n.id_edificio == idEdificio);

        // 4. Traer los espacios/aulas para contabilizar y agrupar
        const todosLosEspacios = await get('/locations/espacios/');
        
        contenedorPisos.innerHTML = ""; // Limpiar mensaje de carga

        if (pisosEdificio.length === 0) {
            contenedorPisos.innerHTML = `<p>No hay pisos o niveles registrados en este edificio.</p>`;
        }

        let totalAulas = 0;

        // Renderizar la distribución de pisos
        pisosEdificio.forEach(piso => {
            const espaciosDelPiso = todosLosEspacios.filter(e => e.id_nivel == piso.id_nivel);
            totalAulas += espaciosDelPiso.length;

            const floorCard = document.createElement("div");
            floorCard.className = "floor-card";
            
            floorCard.innerHTML = `
                <div class="floor-header">
                    <h3>${piso.nombre || `Piso ${piso.numero}`}</h3>
                    <span>${espaciosDelPiso.length} Aulas/Laboratorios</span>
                </div>
                <div class="rooms-list">
                    ${espaciosDelPiso.map(espacio => `
                        <a href="aula.html?id=${espacio.id_espacio}" class="room-link">
                            🚪 ${espacio.nombre}
                        </a>
                    `).join('')}
                </div>
            `;
            contenedorPisos.appendChild(floorCard);
        });

        // Actualizar estadísticas superiores de la maqueta HTML
        document.getElementById("stat-pisos").textContent = pisosEdificio.length;
        document.getElementById("stat-aulas").textContent = totalAulas;
        
        // Consultar conteo de activos globales de forma asíncrona
        const activos = await get('/assets/activos/');
        // Filtrar activos que pertenezcan a los espacios de este edificio
        const idsEspaciosEdificio = todosLosEspacios.filter(e => e.id_nivel && pisosEdificio.some(p => p.id_nivel == e.id_nivel)).map(e => e.id_espacio);
        const activosEdificio = activos.filter(a => idsEspaciosEdificio.includes(a.id_espacio));
        
        document.getElementById("stat-activos").textContent = activosEdificio.length;
        document.getElementById("stat-alertas").textContent = "0"; // Mapear con endpoints de alertas críticas si es necesario

    } catch (error) {
        console.error("Error cargando la infraestructura del edificio:", error);
        if(contenedorPisos) {
            contenedorPisos.innerHTML = `<p style="color:red;">Error al conectar con la infraestructura física de la API.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", inicializarEdificio);