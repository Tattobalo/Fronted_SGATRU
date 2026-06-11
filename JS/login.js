import { API_URL } from './api.js';

async function ejecutarLogin(event) {
    event.preventDefault();

    const usuarioInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value;
    const contenedorError = document.getElementById("mensaje-error");

    if (contenedorError) contenedorError.textContent = "";

    // 1. PREPARAR DATOS (FastAPI usa OAuth2, por lo que espera form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('username', usuarioInput);
    formData.append('password', passwordInput);

    // Limpiamos la URL base por si tiene una barra al final
    const urlDestino = `${API_URL.replace(/\/$/, "")}/login`; 

    try {
        console.log("Validando credenciales con el servidor...");
        
        const response = await fetch(urlDestino, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (response.ok) {
            // 2. ÉXITO: Guardamos el token real devuelto por la base de datos
            const respuesta = await response.json();
            
            localStorage.setItem("sgatru_session", JSON.stringify({
                username: usuarioInput,
                rol: respuesta.rol || "Usuario",
                access_token: respuesta.access_token
            }));
            
            // Redirigimos al SPA
            window.location.href = "../index.html#/home";
            return;
            
        } else {
            // 3. ERROR DE CREDENCIALES: El usuario no existe o la contraseña está mal
            const errorData = await response.json().catch(() => ({}));
            if (contenedorError) {
                contenedorError.textContent = errorData.detail || "Usuario o contraseña incorrectos.";
                contenedorError.style.color = "#d9534f";
            }
            return;
        }
    } catch (apiError) {
        console.error("Fallo de red al intentar hacer login:", apiError);
        if (contenedorError) {
            contenedorError.textContent = "Error de conexión con el servidor. Intente más tarde.";
            contenedorError.style.color = "#d9534f";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-login");
    if (formulario) {
        formulario.addEventListener("submit", ejecutarLogin);
    }
});