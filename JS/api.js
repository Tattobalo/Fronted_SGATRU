// Al crear la clave api, solo es necesario cambiar el valor de API_URL
// a la dirección del servidor donde se aloje la API.
// En este caso, se asume que la API está alojada localmente
// en el puerto 8000.

export const API_URL = "http://127.0.0.1:8000";
//export const API_URL = "https://flf80jw7-8000.usw3.devtunnels.ms/";

/**
 * Función auxiliar para recuperar el token JWT de la sesión
 * y estructurar las cabeceras de autorización de forma limpia.
 */

function construirCabeceras(incluirContentType = true) {
    const cabeceras = {};
    
    if (incluirContentType) {
        cabeceras['Content-Type'] = 'application/json';
    }

    try {
        // Leemos la sesión estructurada que tienes guardada
        const sesion = localStorage.getItem("sgatru_session");
        if (sesion) {
            const datosSesion = JSON.parse(sesion);
            // Inyectamos el token en formato Bearer si existe
            if (datosSesion && datosSesion.access_token) {
                cabeceras['Authorization'] = `Bearer ${datosSesion.access_token}`;
            }
        }
    } catch (error) {
        console.error("Error leyendo las credenciales del localStorage:", error);
    }

    return cabeceras;
}

// Función global para enviar datos (POST)
export async function post(endpoint, data) {
    const endpointLimpio = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${endpointLimpio}`;

    const response = await fetch(urlDestino, {
        method: 'POST',
        headers: construirCabeceras(true), // <- Inyecta Content-Type y Authorization
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en la petición del servidor");
    }
    return await response.json();
}

// Función global para consultar datos (GET)
export async function get(endpoint) {
    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    console.log("Consultando:", urlDestino);

    try {
        const response = await fetch(urlDestino, {
            method: 'GET',
            headers: construirCabeceras(false) 
        });

        console.log("Status:", response.status);

        if (!response.ok) {
            throw new Error(`Error ${response.status} en ${urlDestino}`);
        }

        const data = await response.json();
        console.log("Respuesta obtenida con éxito.");
        return data;

    } catch (error) {
        console.error("FALLO FETCH:", urlDestino, error);
        throw error;
    }
}

// Función global para eliminar recursos (DELETE)
export async function del(endpoint) {
    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    const response = await fetch(urlDestino, { 
        method: 'DELETE',
        headers: construirCabeceras(false)
    });
    
    if (!response.ok) throw new Error("Error al eliminar el recurso");
    return true;
}

// Función global para actualizar datos (PUT)
export async function put(endpoint, data) {
    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    const response = await fetch(urlDestino, {
        method: 'PUT',
        headers: construirCabeceras(true), // Cambios protegidos
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al actualizar el recurso");
    }

    return await response.json();
}