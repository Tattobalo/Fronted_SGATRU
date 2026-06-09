(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get } from './api.js';
import { navegarA } from './router.js'; // <-- Importamos el navegador SPA

export async function renderizarEdificios() {
    try {
        const edificios = await get('/locations/edificios/');
        const contenedor = document.getElementById('contenedor-edificios');
        if (!contenedor) return;
        contenedor.innerHTML = ''; 

        edificios.forEach(edificio => {
            const card = document.createElement('div');
            card.className = 'building-card';
            card.innerHTML = `
                <h2>${edificio.nombre}</h2>
                <span class="status online">● Operativo</span>
                <p>Cargando datos...</p>
                <button class="btn-click-edificio">Ver edificio</button>
            `;
            // Escuchador SPA en lugar de un onclick plano en HTML
            card.querySelector('.btn-click-edificio').onclick = () => {
                navegarA(`/edificio?id=${edificio.id_edificio}`);
            };
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error(error);
    }
}