// import dinamico 
//"/nuevoCampus": async () =>
//(await import("./nuevoCampus.js")).inicializarNuevoCampus(),


import { post } from "./api.js";

export function inicializarNuevoCampus() {
  const form = document.getElementById("formNuevoCampus");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const campus = {
      nombre_campus: document.getElementById("nombreCampus").value.trim(),
      clave_campus: document.getElementById("claveCampus").value.trim(),
      municipio: document.getElementById("municipioCampus").value.trim(),
      estado: document.getElementById("estadoCampus").value.trim(),
      direccion: document.getElementById("direccionCampus").value.trim(),
      telefono: document.getElementById("telefonoCampus").value.trim(),
      correo: document.getElementById("correoCampus").value.trim(),
      responsable: document.getElementById("responsableCampus").value.trim(),
      numero_edificios: Number(document.getElementById("numeroEdificios").value),
      total_espacios: Number(document.getElementById("totalEspacios").value),
      estado_operativo: document.getElementById("estadoOperativo").value,
      tipo_campus: document.getElementById("tipoCampus").value,
      descripcion: document.getElementById("descripcionCampus").value.trim()
    };

    if (!campus.nombre_campus || !campus.clave_campus || !campus.municipio) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      await post("/campus", campus);

      alert("Campus registrado correctamente");

      if (typeof navegar === "function") {
        navegar("/campus");
      } else {
        window.location.href = "index.html#/campus";
      }

    } catch (error) {
      console.error("Error al registrar campus:", error);
      alert("No se pudo registrar el campus. Revisa la conexión con la API.");
    }
  });
}