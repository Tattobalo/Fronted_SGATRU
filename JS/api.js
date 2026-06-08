// Al crear la clave api, solo es necesario cambiar el valor de API_URL 
// a la dirección del servidor donde se aloje la API. 
// En este caso, se asume que la API está alojada localmente 
// en el puerto 8000.
const API_URL = "http://127.0.0.1:8000";

// Función global para enviar datos (POST)
export async function post(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en la petición del servidor");
    }
    return await response.json();
}

export async function get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error("Error al obtener datos");
    return await response.json();
}

export async function del(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Error al eliminar el recurso");
    return true;
}