import { get, del } from './api.js';

async function cargarUsuarios() {
    const tabla = document.querySelector("#tabla-usuarios tbody");
    if (!tabla) return;

    try {
        const usuarios = await get('/assets/responsables/');
        tabla.innerHTML = ""; // Limpiar spinner o datos estáticos

        usuarios.forEach(usuario => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><strong>${usuario.nombre_completo}</strong><br><small>${usuario.correo}</small></td>
                <td>${usuario.username}</td>
                <td>${usuario.rol}</td>
                <td>${usuario.cargo || 'No asignado'}</td>
                <td><span class="status-badge ${usuario.estado ? 'active' : 'inactive'}">${usuario.estado ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn-edit">✏️</button>
                    <button class="btn-delete" data-id="${usuario.id_responsable}">🗑️</button>
                </td>
            `;
            tabla.appendChild(fila);
        });

        // Configurar escuchadores para los botones de eliminar
        document.querySelectorAll(".btn-delete").forEach(botón => {
            botón.addEventListener("click", eliminarUsuario);
        });

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

async function eliminarUsuario(event) {
    const id = event.target.getAttribute("data-id");
    if (confirm("¿Estás seguro de que deseas eliminar este usuario de manera permanente?")) {
        try {
            await del(`/assets/responsables/${id}`);
            alert("Usuario eliminado correctamente.");
            cargarUsuarios(); // Recargar la tabla
        } catch (error) {
            alert("No se pudo eliminar al usuario.");
        }
    }
}

document.addEventListener("DOMContentLoaded", cargarUsuarios);