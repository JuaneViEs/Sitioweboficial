document.addEventListener('DOMContentLoaded', () => {
    // Eventos para el login
    document.getElementById('entrarBtn').addEventListener('click', login);
    document.getElementById('password').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            login();
        }
    });

    // Evento para mostrar el contenedor de cédula al seleccionar un archivo
    document.getElementById('fileInput').addEventListener('change', toggleCedulaContainer);

    // Eventos para buscar persona y regresar
    document.getElementById('buscarBtn').addEventListener('click', buscarPersona);
    document.getElementById('regresarBtn').addEventListener('click', regresar);

    // Evento para generar constancia
    document.getElementById('generateBtn').addEventListener('click', generarConstancia);

    // Evento para regresar al formulario desde la constancia
    document.getElementById('regresarConstanciaBtn').addEventListener('click', regresarConstancia);
});

let personas = []; // Almacena los datos del CSV

// Función de Login
function login() {
    const passwordInput = document.getElementById('password').value;
    if (passwordInput === 'Incess2024') {
        toggleVisibility('formContainer', 'loginContainer', 'passwordError', false);
    } else {
        toggleVisibility('passwordError', false);
    }
}

// Función para mostrar y ocultar elementos
function toggleVisibility(...elements) {
    elements.forEach(element => {
        if (typeof element === 'string') {
            document.getElementById(element).classList.toggle('hidden');
        }
    });
}

// Función para mostrar el contenedor de cédula al seleccionar un archivo
function toggleCedulaContainer() {
    const file = document.getElementById('fileInput').files[0];
    const cedulaContainer = document.getElementById('cedulaContainer');
    file ? cedulaContainer.classList.remove('hidden') : cedulaContainer.classList.add('hidden');
}

// Función de regreso al formulario
function regresar() {
    toggleVisibility('cedulaContainer', 'resultado', 'generateBtn');
    document.getElementById('fileInput').value = ''; // Reiniciar el input de archivo
}

// Función para buscar persona
function buscarPersona() {
    const fileInput = document.getElementById('fileInput');
    const cedulaInput = document.getElementById('cedulaInput').value.trim();

    if (!fileInput.files.length) {
        alert('Por favor, selecciona un archivo CSV.');
        return;
    }
    if (!cedulaInput) {
        alert('Por favor, ingrese una Cédula o ID.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const data = event.target.result;
        
        // Usamos PapaParse para leer el archivo CSV
        const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
        personas = parsed.data;

        // Encontramos a la persona por cédula
        const persona = personas.find(p => p['Cedula'] === cedulaInput);
        if (persona) {
            const nombre = persona['Nombre'] || 'Nombre no disponible';
            const apellido = persona['Apellido'] || 'Apellido no disponible';

            // Mostrar resultado y habilitar generar constancia
            document.getElementById('resultado').textContent = `Persona encontrada: ${nombre} ${apellido}`;
            toggleVisibility('resultado', 'generateBtn');
        } else {
            alert('No se encontró una persona con esa Cédula o ID.');
            toggleVisibility('resultado', 'generateBtn', true);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// Función para generar la constancia en PDF
function generarConstancia() {
    const cedulaInput = document.getElementById('cedulaInput').value.trim();
    const persona = personas.find(p => p['Cedula'] === cedulaInput);

    if (!persona) {
        alert("No se ha encontrado la persona. Por favor, verifica la cédula.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    const docWidth = doc.internal.pageSize.getWidth();
    const docHeight = doc.internal.pageSize.getHeight();

    // Configurar la fuente a Times New Roman
    doc.setFont("times", "normal");

    // --- ENCABEZADO ---
    const encabezadoRuta = 'images/imagen1.jpeg';  // Reemplaza con la ruta de tu imagen
    // Colocamos el encabezado pegado a la parte superior (y usando todo el ancho de la página)
    doc.addImage(encabezadoRuta, 'JPEG', 0, 0, docWidth, 20); // El encabezado tiene una altura de 20

    // Título de la constancia (centrado)
    doc.setFontSize(18);
    doc.text('CONSTANCIA', docWidth / 2, 30, { align: 'center' });

    // Subrayar el título de la constancia (centrado)
    const tituloX = (docWidth - doc.getTextWidth('CONSTANCIA')) / 2;
    const tituloY = 33; // Ajustamos un poco más abajo
    const tituloAncho = doc.getTextWidth('CONSTANCIA');
    doc.setLineWidth(0.5);
    doc.line(tituloX, tituloY, tituloX + tituloAncho, tituloY);

    // --- TEXTO DE LA CONSTANCIA ---
    const today = new Date();
    const day = today.getDate();
    const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();

    const fechaTexto = `los ${day} días de ${month} ${year}`;

    // Unidad curricular con validación de caracteres especiales
    let unidadCurricular = persona['Denominacion de la Formacion'] || 'No disponible';
    unidadCurricular = unidadCurricular.replace(/[^\x20-\x7E\u00C0-\u017F]/g, '');  // Permite acentos y caracteres especiales latinos

    const texto = `
    La Coordinación del Centro de Formación Socialista Carora, INCES Región-Lara hace constar, por medio de la presente, que el (a) ciudadano (a): ${persona['Nombre']} ${persona['Apellido']}, Portador(a) de la Cédula de Identidad V-${persona['Cedula']}, participó en la formación de la Unidad Curricular: ${unidadCurricular}, con una duración de ${persona['Horas']} horas, con fecha de inicio el: ${persona['Fecha de Inicio']} y fecha de término el: ${persona['Fecha de Cierre']}.

    Constancia que se expide a petición de parte interesada en el Municipio Torres, Parroquia Trinidad Samuel, Estado Lara a ${fechaTexto}.

                                                                  Atentamente
                                                                  
                                                                  Jesus Campos                                                  
                                                                  Jefe de Centro
                           Según el orden administrativo N OA-2024-02-29 de fecha 15-02-2024
    `;

    // Ajustar el texto en la página
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(texto, docWidth - 2 * margin);
    let yOffset = 50; // Empezamos el texto después del encabezado

    lines.forEach(line => {
        doc.text(line, margin, yOffset);
        yOffset += 10;
    });

    // --- PIE DE PÁGINA ---
    const piePaginaRuta = 'images/imagen2.jpeg';  // Reemplaza con la ruta de tu imagen
    // Colocamos el pie de página pegado a la parte inferior de la página
    doc.addImage(piePaginaRuta, 'JPEG', 0, docHeight - 20, docWidth, 20); // El pie de página tiene una altura de 20

    // Guardar el PDF
    doc.save(`constancia_${persona['Nombre']}_${persona['Apellido']}.pdf`);
}

// Función para regresar al formulario desde la constancia
function regresarConstancia() {
    toggleVisibility('constanciaContainer', 'formContainer', false);
}

