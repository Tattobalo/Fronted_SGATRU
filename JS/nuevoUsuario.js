import { post, get } from './api.js';
import { navegarA } from './router.js';

let listaEdificios = [];
let listaNiveles = [];
let listaEspacios = [];

export async function inicializarNuevoUsuario() {
    const selectEdificio = document.getElementById("edificio_asignado");
    const selectPiso = document.getElementById("piso_asignado");
    const selectAula = document.getElementById("aula_asignada");
    
    if (!selectEdificio) return;

    // 1. Limpieza de eventos para evitar que se dupliquen si navegas varias veces
    selectEdificio.removeEventListener("change", handleEdificioChange);
    selectPiso.removeEventListener("change", handlePisoChange);

    // 2. Vincular nuevamente
    selectEdificio.addEventListener("change", handleEdificioChange);
    selectPiso.addEventListener("change", handlePisoChange);

    try {
        // Carga forzada de catálogos cada vez que se abre el formulario
        [listaEdificios, listaNiveles, listaEspacios] = await Promise.all([
            get('/locations/edificios/'),
            get('/locations/niveles/'),
            get('/locations/espacios/')
        ]);

        selectEdificio.innerHTML = '<option value="">Selecciona un edificio</option><option value="Campus completo">Campus completo</option>';
        listaEdificios.forEach(edificio => {
            const opt = document.createElement("option");
            opt.value = edificio.id_edificio;
            opt.textContent = edificio.nombre;
            selectEdificio.appendChild(opt);
        });

    } catch (error) {
        console.error("Error al inicializar la estructura geográfica:", error);
    }

    const formulario = document.getElementById('form-nuevo-usuario');
    if (formulario) {
        formulario.onsubmit = registrarUsuario;
    }
}

function handleEdificioChange(event) {
    const idEdificioSel = event.target.value;
    const selectPiso = document.getElementById("piso_asignado");
    const selectAula = document.getElementById("aula_asignada");

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

    const espaciosFiltrados = listaEspacios.filter(e => e.id_nivel == idNivelSel);
    if (espaciosFiltrados.length > 0) {
        selectAula.disabled = false;
        espaciosFiltrados.forEach(espacio => {
            const opt = document.createElement("option");
            opt.value = espacio.id_espacio;
            opt.textContent = espacio.nombre_aula;
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
        await post('/assets/responsables/', datosUsuario);
        alert("¡Usuario registrado exitosamente!");
        navegarA('/usuarios');
    } catch (error) {
        console.error("Error en el registro:", error);
        alert(`No se pudo registrar el usuario: ${error.message}`);
    }
}