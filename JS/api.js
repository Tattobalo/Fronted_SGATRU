// Al crear la clave api, solo es necesario cambiar el valor de API_URL 
// a la dirección del servidor donde se aloje la API. 
// En este caso, se asume que la API está alojada localmente 
// en el puerto 8000.
const API_URL = "http://127.0.0.1:8000";

// Función global para pedir datos
export async function get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    return await response.json();
}