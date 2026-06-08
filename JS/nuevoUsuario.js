import { post, get } from './api.js';

// Variables globales para mantener la caché local de la estructura física
let listaEdificios = [];
let listaNiveles = [];
let listaEspacios = [];

async function cargarJerarquiaInicial() {
    const selectEdificio = document.getElementById("edificio_asignado");

    try {
        // 1. Obtener la infraestructura de los endpoints correspondientes
        listaEdificios = await get('/locations/edificios/');
        listaNiveles = await get('/locations/niveles/');
        listaEspacios = await get('/locations/espacios/');

        // 2. Poblar select primario de Edificios
        listaEdificios.forEach(edificio => {
            const opt = document.createElement("option");
            opt.value = edificio.id_edificio; // Guardamos el ID como valor
            opt.textContent = edificio.nombre; // Ej: "Edificio A"
            selectEdificio.appendChild(opt);
        });

    } catch (error) {
        console.error("Error al inicializar la estructura geográfica:", error);
    }
}

function handleEdificioChange(event) {
    const idEdificioSel = event.target.value;
    const selectPiso = document.getElementById("piso_asignado");
    const selectAula = document.getElementById("aula_asignada");

    // Resetear niveles inferiores
    selectPiso.innerHTML = '<option value="">Selecciona un piso</option>';
    selectAula.innerHTML = '<option value="">Selecciona un espacio</option>';
    selectPiso.disabled = true;
    selectAula.disabled = true;

    if (!idEdificioSel) return;

    if (idEdificioSel === "Campus completo") {
        selectPiso.innerHTML = '<option value="Todos">Todos los pisos</option>';
        selectAula.innerHTML = '<option value="Todos">Todas las aulas</option>';
        selectPiso.disabled = false;
        selectAula.disabled = false;
        return;
    }

    // Filtrar los niveles que pertenezcan al edificio seleccionado
    const nivelesFiltrados = listaNiveles.filter(n => n.id_edificio == idEdificioSel);

    if (nivelesFiltrados.length > 0) {
        selectPiso.disabled = false;
        nivelesFiltrados.forEach(nivel => {
            const opt = document.createElement("option");
            opt.value = nivel.id_nivel;
            opt.textContent = `Piso ${nivel.numero_nivel}`;
            selectPiso.appendChild(opt);
        });
    }
}

function handlePisoChange(event) {
    const idNivelSel = event.target.value;
    const selectAula = document.getElementById("aula_asignada");

    selectAula.innerHTML = '<option value="">Selecciona un espacio</option>';
    selectAula.disabled = true;

    if (!idNivelSel) return;

    if (idNivelSel === "Todos") {
        selectAula.innerHTML = '<option value="Todos">Todas las aulas</option>';
        selectAula.disabled = false;
        return;
    }

    // Filtrar los espacios/aulas que pertenezcan al nivel seleccionado
    const espaciosFiltrados = listaEspacios.filter(e => e.id_nivel == idNivelSel);

    if (espaciosFiltrados.length > 0) {
        selectAula.disabled = false;
        espaciosFiltrados.forEach(espacio => {
            const opt = document.createElement("option");
            opt.value = espacio.id_espacio;
            opt.textContent = espacio.nombre_aula; // Ej: "Laboratorio 1"
            selectAula.appendChild(opt);
        });
    }
}

async function registrarUsuario(event) {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
        alert("Las contraseñas ingresadas no coinciden.");
        return;
    }

    const selectEdificio = document.getElementById('edificio_asignado');
    const selectPiso = document.getElementById('piso_asignado');
    const selectAula = document.getElementById('aula_asignada');

    // Construir el payload guardando los nombres legibles seleccionados para el esquema
    const datosUsuario = {
        nombre_completo: document.getElementById('nombre_completo').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value || null,
        cargo: document.getElementById('cargo').value || null,
        username: document.getElementById('username').value,
        password: password,
        estado: document.getElementById('estado').value === "true",
        rol: document.getElementById('rol').value,
        edificio_asignado: selectEdificio.options[selectEdificio.selectedIndex].text,
        piso_asignado: selectPiso.options[selectPiso.selectedIndex].text,
        aula_asignada: selectAula.options[selectAula.selectedIndex].text
    };

    try {
        const resultado = await post('/assets/responsables/', datosUsuario);
        console.log("Usuario registrado con éxito:", resultado);
        alert("¡Usuario registrado exitosamente en el sistema!");
        window.location.href = 'usuarios.html';
    } catch (error) {
        console.error("Error en el registro:", error);
        alert(`No se pudo registrar el usuario: ${error.message}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar catálogos
    cargarJerarquiaInicial();

    // Enlazar los eventos change para la cascada
    document.getElementById("edificio_asignado").addEventListener("change", handleEdificioChange);
    document.getElementById("piso_asignado").addEventListener("change", handlePisoChange);

    const formulario = document.getElementById('form-nuevo-usuario');
    if (formulario) {
        formulario.addEventListener('submit', registrarUsuario);
    }
});