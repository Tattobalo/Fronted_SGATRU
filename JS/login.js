import { get, post, API_URL } from './api.js';

async function ejecutarLogin(event) {
    event.preventDefault();

    const usuarioInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value;
    const contenedorError = document.getElementById("mensaje-error");

    if (contenedorError) contenedorError.textContent = "";

    // =========================================================================
    // 1. BYPASS DE DESARROLLO (Prioridad Máxima)
    // =========================================================================
    // Si usas cualquiera de tus usuarios administradores de prueba, entras directo
    if (usuarioInput === "kminigo" || usuarioInput === "kuriel" || usuarioInput === "admin") {
        console.log("Acceso concedido mediante bypass local de auditoría.");
        localStorage.setItem("sgatru_session", JSON.stringify({
            username: usuarioInput,
            rol: "Administrador de Red",
            token: "dev_session_bypass_authorized"
        }));
        
        // Redirección directa al Dashboard
        window.location.href = "HTML/home.html";
        return; 
    }

    // =========================================================================
    // 2. INTENTO CON EL BACKEND (Solo si no es un usuario del bypass)
    // =========================================================================
    const formData = new URLSearchParams();
    formData.append('username', usuarioInput);
    formData.append('password', passwordInput);

    const urlDestino = `${API_URL.replace(/\/$/, "")}/login`; 

    try {
        console.log("Enviando credenciales al servidor local:", urlDestino);
        const response = await fetch(urlDestino, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (response.ok) {
            const respuesta = await response.json();
            localStorage.setItem("sgatru_session", JSON.stringify({
                username: usuarioInput,
                rol: respuesta.rol || "Administrador",
                token: respuesta.access_token
            }));
            
            window.location.href = "HTML/home.html";
            return;
        } else {
            const errorData = await response.json().catch(() => ({}));
            if (contenedorError) {
                contenedorError.textContent = `Servidor: ${errorData.detail || "Error de credenciales"}`;
                contenedorError.style.color = "#d9534f";
                return;
            }
        }
    } catch (apiError) {
        console.warn("El backend no respondió de forma limpia.", apiError);
    }

    // Mensaje de error general si falla todo lo demás
    if (contenedorError) {
        contenedorError.textContent = "Usuario o contraseña incorrectos.";
        contenedorError.style.color = "#d9534f";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-login");
    if (formulario) {
        formulario.addEventListener("submit", ejecutarLogin);
    }
});