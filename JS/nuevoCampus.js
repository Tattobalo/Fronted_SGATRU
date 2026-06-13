// import dinamico 
//"/campus": async () =>
//(await import("./campus.js")).inicializarCampus(),


import { get } from "./api.js";

export async function inicializarCampus() {
  const contenedor = document.getElementById("contenedorCampus");
  const btnNuevoCampus = document.getElementById("btnNuevoCampus");

  if (btnNuevoCampus) {
    btnNuevoCampus.addEventListener("click", () => {
      navegar("/nuevoCampus");
    });
  }

  if (!contenedor) return;

  try {
    const campus = await get("/campus");

    contenedor.innerHTML = "";

    if (!campus || campus.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-card">
          <h3>No hay campus registrados</h3>
          <p>Agrega un nuevo campus para comenzar la estructura.</p>
        </div>
      `;
      return;
    }

    campus.forEach((item) => {
      const card = document.createElement("div");
      card.classList.add("building-card");

      card.innerHTML = `
        <h2>🏫 ${item.nombre_campus}</h2>
        <span class="status online">● ${item.estado_operativo || "Operativo"}</span>
        <p><strong>Clave:</strong> ${item.clave_campus || "Sin clave"}</p>
        <p><strong>Municipio:</strong> ${item.municipio || "No registrado"}</p>
        <p><strong>Edificios:</strong> ${item.numero_edificios || 0}</p>

        <button class="btn-ver-campus">
          Ver campus
        </button>
      `;

      card.querySelector(".btn-ver-campus").addEventListener("click", () => {
        localStorage.setItem("campusSeleccionado", JSON.stringify(item));
        navegar("/edificio");
      });

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("Error al cargar campus:", error);

    contenedor.innerHTML = `
      <div class="empty-card">
        <h3>Error al cargar campus</h3>
        <p>Revisa la conexión con la API o usa datos de prueba.</p>
      </div>
    `;
  }
}