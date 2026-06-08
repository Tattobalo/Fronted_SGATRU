// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';

async function renderizarEdificios() {
    try {
        const edificios = await get('/locations/edificios/');
        console.log("Edificios obtenidos:", edificios); // MIRA ESTO EN TU CONSOLA F12
        
        const contenedor = document.getElementById('contenedor-edificios');
        if (!contenedor) return;

        contenedor.innerHTML = ''; // Limpiamos "Cargando..."

        edificios.forEach(edificio => {
            const card = document.createElement('div');
            card.className = 'building-card';
            card.innerHTML = `
                <h2>${edificio.nombre}</h2>
                <span class="status online">● Operativo</span>
                <p>Cargando datos...</p>
                <button onclick="window.location.href='edificio.html?id=${edificio.id_edificio}'">
                    Ver edificio
                </button>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error crítico en renderizado:", error);
        document.getElementById('contenedor-edificios').innerHTML = '<p>Error al cargar edificios.</p>';
    }
}

document.addEventListener("DOMContentLoaded", renderizarEdificios);