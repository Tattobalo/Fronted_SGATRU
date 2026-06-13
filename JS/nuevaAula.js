// import dinamico 
// "/nuevoEspacio": async () =>
//(await import("./nuevoEspacio.js"))
//.inicializarNuevoEspacio(),


import { post } from "./api.js";

export function inicializarNuevoEspacio() {

    const form = document.getElementById("formNuevoEspacio");

    if (!form) return;

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const espacio = {

            nombre_espacio: document.getElementById("nombreEspacio").value.trim(),

            tipo_espacio: document.getElementById("tipoEspacio").value,

            edificio_id: document.getElementById("edificioEspacio").value,

            nivel_id: document.getElementById("nivelEspacio").value,

            capacidad: Number(
                document.getElementById("capacidadEspacio").value
            ),

            responsable: document.getElementById("responsableEspacio").value.trim(),

            observaciones: document.getElementById("observacionesEspacio").value.trim()

        };

        if (
            !espacio.nombre_espacio ||
            !espacio.tipo_espacio ||
            !espacio.edificio_id ||
            !espacio.nivel_id
        ) {
            alert("Completa los campos obligatorios.");
            return;
        }

        try {

            await post("/espacios", espacio);

            alert("Espacio académico registrado correctamente.");

            if (typeof navegar === "function") {
                navegar("/aula");
            }

        } catch (error) {

            console.error(error);

            alert("Error al registrar el espacio académico.");

        }

    });

}