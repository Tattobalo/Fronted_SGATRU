import { inicializarDashboard } from './home.js';
import { inicializarCampus } from './campus.js';
import { inicializarEdificio } from './edificio.js';
import { inicializarMapaNivel } from './nivel.js';
import { inicializarAula } from './aula.js';
import { inicializarDetalleEquipo } from './equipo.js';
import { cargarInventario } from './inventario.js';
import { cargarAlertas } from './alertas.js';
import { cargarUsuarios } from './usuarios.js';
import { inicializarNuevoUsuario } from './nuevoUsuario.js';
import { inicializarNuevoActivo } from './nuevoActivo.js';
import { cargarReportes } from './reportes.js';

// Mapeo estricto de las rutas virtuales a tus archivos HTML físicos
const mapasDeVistas = {
  '/home': 'HTML/home.html',
  '/campus': 'HTML/campus.html',
  '/edificio': 'HTML/edificio.html',
  '/nivel': 'HTML/nivel.html',
  '/aula': 'HTML/aula.html',
  '/equipo': 'HTML/equipo.html',
  '/inventario': 'HTML/inventario.html',
  '/alertas': 'HTML/alertas.html',
  '/usuarios': 'HTML/usuarios.html',
  '/nuevoUsuario': 'HTML/nuevoUsuario.html',
  '/reportes': 'HTML/reportes.html',
  '/nuevoActivo': 'HTML/nuevoActivo.html'
};

const controladores = {
  '/home': inicializarDashboard,
  '/campus': inicializarCampus,
  '/edificio': inicializarEdificio,
  '/nivel': inicializarMapaNivel,
  '/aula': inicializarAula,
  '/equipo': inicializarDetalleEquipo,
  '/inventario': cargarInventario,
  '/nuevoActivo': inicializarNuevoActivo,
  '/alertas': cargarAlertas,
  '/usuarios': cargarUsuarios,
  '/reportes': cargarReportes,
  '/nuevoUsuario': inicializarNuevoUsuario
};

export const navegarA = (ruta) => {
  window.location.hash = ruta;
};

const router = async () => {
  const sesionActiva = localStorage.getItem("sgatru_session");
  const pathCompleto = window.location.pathname;

  if (!sesionActiva && !pathCompleto.includes("login.html")) {
    window.location.href = "HTML/login.html";
    return;
  }

  let hash = window.location.hash.replace("#", "").trim();
  let rutaLimpia = hash.split('?')[0];

  if (!rutaLimpia || rutaLimpia === "/" || rutaLimpia === "") {
    window.location.hash = "/home";
    return;
  }

  const rutaActual = mapasDeVistas[rutaLimpia] ? rutaLimpia : '/home';
  const archivoFisicoHTML = mapasDeVistas[rutaActual];

  const contenedor = document.getElementById("spa-content");
  if (contenedor) {
    try {
      const respuesta = await fetch(archivoFisicoHTML);
      if (!respuesta.ok) throw new Error("No se pudo cargar la vista física");

      const htmlCrudo = await respuesta.text();

      contenedor.innerHTML = htmlCrudo;

    } catch (error) {
      console.error("Error al inyectar la vista dinámica:", error);
      contenedor.innerHTML = `<p style="padding:20px; color:red;">Error al cargar el componente virtual: ${rutaActual}</p>`;
    }
  }

  // Sincronizar clases estéticas de selección activa del Sidebar
  document.querySelectorAll(".sidebar nav a").forEach(link => {
    link.classList.remove("active");
    const hrefAtributo = link.getAttribute("href");
    if (hrefAtributo === `#${rutaActual}`) {
      link.classList.add("active");
    }
  });

  // Disparar lógica asíncrona de conexión con FastAPI una vez montado el DOM completo
  if (controladores[rutaActual]) {
    controladores[rutaActual]();
  }
};

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", e => {
    const targetLink = e.target.closest("[data-link]");
    if (targetLink) {
      e.preventDefault();
      navegarA(targetLink.getAttribute("href").replace("#", ""));
    }
  });
  router();
});

export function obtenerParametrosHash() {
    const hash = window.location.hash;

    if (!hash.includes("?")) {
        return new URLSearchParams();
    }

    return new URLSearchParams(
        hash.split("?")[1]
    );
}