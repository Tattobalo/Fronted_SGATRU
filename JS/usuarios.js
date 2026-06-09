(function protegerInterfaz() {
    const sesionActiva = localStorage.getItem("sgatru_session");
    if (!sesionActiva) {
        window.location.href = "HTML/login.html"; // Redirige al login de inmediato
    }
})();

import { get, del, put } from './api.js';

let listaUsuariosGlobal = [];

export async function cargarUsuarios() {
    try {
        listaUsuariosGlobal = await get('/assets/responsables/');

        const admins = listaUsuariosGlobal.filter(u => u.rol === "Administrador de Red");
        const responsables = listaUsuariosGlobal.filter(u => u.rol === "Responsable de Área");
        const consulta = listaUsuariosGlobal.filter(u => u.rol === "Usuario de Consulta" || u.rol === "Auxiliar de Inventario");

        if (document.getElementById("resumen-total-usuarios")) {
            document.getElementById("resumen-total-usuarios").textContent = listaUsuariosGlobal.length;
            document.getElementById("resumen-admins").textContent = admins.length;
            document.getElementById("resumen-responsables").textContent = responsables.length;
            document.getElementById("resumen-consulta").textContent = consulta.length;
        }

        renderizarTabla(listaUsuariosGlobal);
        vincularFiltrosUsuarios();

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

function renderizarTabla(usuariosLista) {
    const tabla = document.querySelector("#tabla-usuarios tbody");
    if (!tabla) return;
    tabla.innerHTML = "";

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

    document.querySelectorAll(".btn-delete").forEach(botón => botón.addEventListener("click", eliminarUsuario));
    document.querySelectorAll(".btn-edit").forEach(botón => botón.addEventListener("click", abrirModalEdicion));
}

function ejecutarFiltrado() {
    const textoBusqueda = document.getElementById("filtro-busqueda").value.toLowerCase().trim();
    const rolSeleccionado = document.getElementById("filtro-rol").value;
    const estadoSeleccionado = document.getElementById("filtro-estado").value;

    const usuariosFiltrados = listaUsuariosGlobal.filter(usuario => {
        const cumpleTexto = !textoBusqueda ||
            usuario.nombre_completo.toLowerCase().includes(textoBusqueda) ||
            usuario.correo.toLowerCase().includes(textoBusqueda) ||
            usuario.rol.toLowerCase().includes(textoBusqueda);

        const cumpleRol = !rolSeleccionado || usuario.rol === rolSeleccionado;

        let cumpleEstado = true;
        if (estadoSeleccionado !== "") {
            cumpleEstado = usuario.estado === (estadoSeleccionado === "true");
        }

        return cumpleTexto && cumpleRol && cumpleEstado;
    });

    renderizarTabla(usuariosFiltrados);
}

async function eliminarUsuario(event) {
    const id = event.target.closest(".btn-delete").getAttribute("data-id");
    if (confirm("¿Estás seguro de que deseas eliminar este usuario de manera permanente?")) {
        try {
            await del(`/assets/responsables/${id}`);
            alert("Usuario eliminado correctamente.");
            cargarUsuarios();
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

    const modal = document.getElementById("modal-editar-usuario");
    if (modal) modal.style.display = "flex";
}

// CORRECCIÓN MODULAR: Función de cierre limpia para el modal
function cerrarModalEdicion() {
    const modal = document.getElementById("modal-editar-usuario");
    if (modal) modal.style.display = "none";
}

function vincularFiltrosUsuarios() {
    const btnFiltrar = document.getElementById("btn-filtrar-usuarios");
    if (btnFiltrar) btnFiltrar.addEventListener("click", ejecutarFiltrado);

    const inputBusqueda = document.getElementById("filtro-busqueda");
    if (inputBusqueda) inputBusqueda.addEventListener("input", ejecutarFiltrado);

    // Vinculación del botón cancelar del modal
    const btnCancelar = document.getElementById("btn-cancelar-edicion");
    if (btnCancelar) btnCancelar.addEventListener("click", cerrarModalEdicion);

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
                await put(
                    `/assets/responsables/${idUsuario}`,
                    datosActualizados
                );
                alert("¡Información de usuario actualizada con éxito!");
                cerrarModalEdicion();
                cargarUsuarios();
            } catch (error) {
                alert("Ocurrió un problema de comunicación al actualizar los datos en el servidor.");
            }
        });
    }
}