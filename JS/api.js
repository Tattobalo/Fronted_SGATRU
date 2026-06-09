// Al crear la clave api, solo es necesario cambiar el valor de API_URL 
// a la dirección del servidor donde se aloje la API. 
// En este caso, se asume que la API está alojada localmente 
// en el puerto 8000.
//export const API_URL = "http://127.0.0.1:8000";
export const API_URL = "https://flf80jw7-8000.usw3.devtunnels.ms/";

// Función global para enviar datos (POST)
export async function post(endpoint, data) {
    // 1. Limpiar el endpoint para que no empiece con '/'
    const endpointLimpio = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // 2. Asegurar la URL base sin barra al final y unirla con el endpoint usando una sola barra divisoria
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${endpointLimpio}`;

    const response = await fetch(urlDestino, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en la petición del servidor");
    }
    return await response.json();
}

export async function get(endpoint) {

    const rutaLimpia = endpoint.startsWith('/')
        ? endpoint.slice(1)
        : endpoint;

    const urlDestino =
        `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    console.log("Consultando:", urlDestino);

    try {

        const response = await fetch(urlDestino);

        console.log("Status:", response.status);

        if (!response.ok) {
            throw new Error(
                `Error ${response.status} en ${urlDestino}`
            );
        }

        const data = await response.json();

        console.log("Respuesta:", data);

        return data;

    } catch (error) {

        console.error(
            "FALLO FETCH:",
            urlDestino,
            error
        );

        throw error;
    }
}

export async function del(endpoint) {
    // 1. Limpiar el endpoint para que no empiece con '/'
    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // CORRECCIÓN: Unificación segura de URL para el método DELETE
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    const response = await fetch(urlDestino, { method: 'DELETE' });
    if (!response.ok) throw new Error("Error al eliminar el recurso");
    return true;
}

export async function put(endpoint, data) {
    const rutaLimpia = endpoint.startsWith('/')
        ? endpoint.slice(1)
        : endpoint;

    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;

    const response = await fetch(urlDestino, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al actualizar el recurso");
    }

    return await response.json();
}