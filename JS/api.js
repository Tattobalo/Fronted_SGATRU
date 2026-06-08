// Al crear la clave api, solo es necesario cambiar el valor de API_URL 
// a la dirección del servidor donde se aloje la API. 
// En este caso, se asume que la API está alojada localmente 
// en el puerto 8000.
export const API_URL = "http://127.0.0.1:8000";
//export const API_URL = "https://flf80jw7-8000.usw3.devtunnels.ms/";

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
    // 1. Limpiar el endpoint para que no empiece con '/'
    const rutaLimpia = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // CORRECCIÓN CLAVE: Agregamos la barra '/' en medio de la URL base y la ruta limpia
    const urlDestino = `${API_URL.replace(/\/$/, "")}/${rutaLimpia}`;
    
    const response = await fetch(urlDestino);
    if (!response.ok) throw new Error(`Error al obtener datos de: ${endpoint}`);
    return await response.json();
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