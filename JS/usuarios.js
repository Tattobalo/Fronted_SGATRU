// Función de protección de interfaz, se ejecuta inmediatamente al cargar el script
(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "../login.html"; // Redirige al login de inmediato
    }
})();

import { get, del, post } from './api.js';

// Variable global en memoria para guardar la lista original bajada de PostgreSQL
let listaUsuariosGlobal = [];

async function cargarUsuarios() {
    try {
        // 1. Obtener la colección completa de responsables desde FastAPI
        listaUsuariosGlobal = await get('/assets/responsables/');

        // 2. Calcular y pintar las tarjetas analíticas superiores (Totales)
        const admins = listaUsuariosGlobal.filter(u => u.rol === "Administrador de Red");
        const responsables = listaUsuariosGlobal.filter(u => u.rol === "Responsable de Área");
        const consulta = listaUsuariosGlobal.filter(u => u.rol === "Usuario de Consulta" || u.rol === "Auxiliar de Inventario");

        if (document.getElementById("resumen-total-usuarios")) {
            document.getElementById("resumen-total-usuarios").textContent = listaUsuariosGlobal.length;
            document.getElementById("resumen-admins").textContent = admins.length;
            document.getElementById("resumen-responsables").textContent = responsables.length;
            document.getElementById("resumen-consulta").textContent = consulta.length;
        }

        // 3. Renderizar la tabla inicialmente con todos los registros
        renderizarTabla(listaUsuariosGlobal);

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

/**
 * Función encargada exclusivamente de pintar las filas en el HTML
 * @param {Array} usuariosLista - Arreglo de objetos de usuarios a dibujar
 */
function renderizarTabla(usuariosLista) {
    const tabla = document.querySelector("#tabla-usuarios tbody");
    if (!tabla) return;

    tabla.innerHTML = ""; // Limpiar filas anteriores

    if (usuariosLista.length === 0) {
        tabla.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#718096; font-style:italic; padding:20px;">No se encontraron usuarios con los filtros seleccionados.</td></tr>`;
        return;
    }

    usuariosLista.forEach(usuario => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><strong>${usuario.nombre_completo}</strong><br><small>${usuario.correo}</small></td>
            <td>${usuario.username}</td>
            <td>${usuario.rol}</td>
            <td>${usuario.cargo || 'No asignado'}</td>
            <td><span class="status-badge ${usuario.estado ? 'active' : 'inactive'}">${usuario.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn-edit" 
                    data-id="${usuario.id_responsable}"
                    data-nombre="${usuario.nombre_completo}"
                    data-correo="${usuario.correo}"
                    data-cargo="${usuario.cargo || ''}"
                    data-rol="${usuario.rol}">✏️</button>
                <button class="btn-delete" data-id="${usuario.id_responsable}">🗑️</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    // Re-vincular escuchadores dinámicos tras cada rediseño de la tabla
    document.querySelectorAll(".btn-delete").forEach(botón => botón.addEventListener("click", eliminarUsuario));
    document.querySelectorAll(".btn-edit").forEach(botón => botón.addEventListener("click", abrirModalEdicion));
}

// =========================================================================
// LÓGICA DE FILTRADO MULTI-CRITERIO (NUEVO)
// =========================================================================
function ejecutarFiltrado() {
    const textoBusqueda = document.getElementById("filtro-busqueda").value.toLowerCase().trim();
    const rolSeleccionado = document.getElementById("filtro-rol").value;
    const estadoSeleccionado = document.getElementById("filtro-estado").value;

    // Aplicamos los tres filtros en cascada sobre la lista original en memoria
    const usuariosFiltrados = listaUsuariosGlobal.filter(usuario => {
        // 1. Filtro por caja de texto (Nombre, Correo o Rol)
        const cumpleTexto = !textoBusqueda || 
            usuario.nombre_completo.toLowerCase().includes(textoBusqueda) ||
            usuario.correo.toLowerCase().includes(textoBusqueda) ||
            usuario.rol.toLowerCase().includes(textoBusqueda);

        // 2. Filtro por el selector de Roles
        const cumpleRol = !rolSeleccionado || usuario.rol === rolSeleccionado;

        // 3. Filtro por el selector de Estado (Activo/Inactivo)
        let cumpleEstado = true;
        if (estadoSeleccionado !== "") {
            const estadoBool = estadoSeleccionado === "true";
            cumpleEstado = usuario.estado === estadoBool;
        }

        return cumpleTexto && cumpleRol && cumpleEstado;
    });

    // Redibujamos la tabla únicamente con los elementos que pasaron el filtro
    renderizarTabla(usuariosFiltrados);
}

// =========================================================================
// GESTIÓN DE ACCIONES (ELIMINAR Y EDITAR)
// =========================================================================
async function eliminarUsuario(event) {
    const boton = event.target.closest(".btn-delete");
    const id = boton.getAttribute("data-id");
    
    if (confirm("¿Estás seguro de que deseas eliminar este usuario de manera permanente?")) {
        try {
            await del(`/assets/responsables/${id}`);
            alert("Usuario eliminado correctamente.");
            cargarUsuarios(); // Recargar datos base
        } catch (error) {
            alert("No se pudo eliminar al usuario.");
        }
    }
}

function abrirModalEdicion(event) {
    const boton = event.target.closest(".btn-edit");
    
    document.getElementById("edit-user-id").value = boton.getAttribute("data-id");
    document.getElementById("edit-user-nombre").value = boton.getAttribute("data-nombre");
    document.getElementById("edit-user-correo").value = boton.getAttribute("data-correo");
    document.getElementById("edit-user-cargo").value = boton.getAttribute("data-cargo");
    document.getElementById("edit-user-rol").value = boton.getAttribute("data-rol");

    document.getElementById("modal-editar-usuario").style.display = "flex";
}

window.cerrarModalEdicion = () => {
    document.getElementById("modal-editar-usuario").style.display = "none";
};

// =========================================================================
// ESCUCHADORES DE EVENTOS DEL DOM
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carga inicial de datos de la base de datos
    cargarUsuarios();

    // 2. Vincular el botón verde de "Filtrar"
    const btnFiltrar = document.getElementById("btn-filtrar-usuarios");
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", ejecutarFiltrado);
    }

    // INTERACTIVIDAD EXTRA: Filtrado reactivo en tiempo real mientras escribes
    const inputBusqueda = document.getElementById("filtro-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", ejecutarFiltrado);
    }

    // 3. Vincular el submit del formulario del modal de edición
    const formEditar = document.getElementById("form-editar-usuario");
    if (formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const idUsuario = document.getElementById("edit-user-id").value;
            const datosActualizados = {
                nombre_completo: document.getElementById("edit-user-nombre").value,
                correo: document.getElementById("edit-user-correo").value,
                cargo: document.getElementById("edit-user-cargo").value,
                rol: document.getElementById("edit-user-rol").value
            };

            try {
                await post(`/assets/responsables/actualizar/${idUsuario}`, datosActualizados);
                alert("¡Información de usuario actualizada con éxito!");
                window.cerrarModalEdicion();
                cargarUsuarios(); // Recarga limpia
            } catch (error) {
                console.error("Error al actualizar responsable:", error);
                alert("Ocurrió un problema de comunicación al actualizar los datos en el servidor.");
            }
        });
    }
});