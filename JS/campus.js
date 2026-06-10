(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "login.html"; 
    }
})();

import { get } from './api.js';
import { navegarA } from './router.js';

// Renombramos la función para que abarque todo el proceso de la vista
export async function inicializarCampus() {
    
    // 1. INYECTAR EL ROL DINÁMICO
    const datosSesion = JSON.parse(localStorage.getItem("sgatru_session"));
    const txtRol = document.getElementById("rol-usuario-topbar");
    if (txtRol && datosSesion && datosSesion.rol) {
        txtRol.textContent = datosSesion.rol;
    }

    try {
        // 2. DESCARGAR TODOS LOS DATOS SIMULTÁNEAMENTE
        const [activos, alertas, edificios] = await Promise.all([
            get('/assets/activos/'),
            get('/monitoring/alertas/'),
            get('/locations/edificios/')
        ]);

        // 3. MATEMÁTICA DE ESTADÍSTICAS
        const alertasActivas = alertas.filter(al => al.resuelta === false);
        const totalOffline = alertasActivas.length;
        const totalActivos = activos.length;
        const totalOnline = Math.max(0, totalActivos - totalOffline);

        // 4. INYECTAR NÚMEROS EN LAS TARJETAS (SUMMARY)
        const elActivos = document.getElementById("campus-activos-totales");
        const elOnline = document.getElementById("campus-online");
        const elOffline = document.getElementById("campus-offline");
        const elAlertas = document.getElementById("campus-alertas");

        if (elActivos) elActivos.textContent = totalActivos;
        if (elOnline) elOnline.textContent = totalOnline;
        if (elOffline) elOffline.textContent = totalOffline;
        if (elAlertas) elAlertas.textContent = alertasActivas.length;

        // 5. RENDERIZAR LOS EDIFICIOS DINÁMICAMENTE
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
            
            // Escuchador SPA
            card.querySelector('.btn-click-edificio').onclick = () => {
                navegarA(`/edificio?id=${edificio.id_edificio}`);
            };
            
            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error inicializando la vista de Campus:", error);
    }
}