import { get } from './api.js';

// Renderizado específico dependiendo de la página en la que se navegue
async function inicializarVistasUbicacion() {
    const contenedorCampus = document.getElementById("contenedor-campus");
    const contenedorEdificios = document.getElementById("contenedor-edificios");
    const contenedorAulas = document.getElementById("contenedor-aulas");

    // Si estamos en campus.html
    if (contenedorCampus) {
        const datos = await get('/locations/campus/');
        contenedorCampus.innerHTML = datos.map(c => `
            <div class="card-campus">
                <h3>${c.nombre}</h3>
                <p>Ubicación: ${c.direccion || 'Principal'}</p>
            </div>
        `).join('');
    }

    // Si estamos en edificio.html
    if (contenedorEdificios) {
        const datos = await get('/locations/edificios/');
        contenedorEdificios.innerHTML = datos.map(e => `
            <div class="card-edificio">
                <h3>${e.nombre}</h3>
                <p>Pisos totales: ${e.cantidad_pisos || 'N/A'}</p>
            </div>
        `).join('');
    }
}

document.addEventListener("DOMContentLoaded", inicializarVistasUbicacion);