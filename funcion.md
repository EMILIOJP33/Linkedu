Actúa como un desarrollador Frontend Senior. Seguimos puliendo mi aplicación web educativa para que sea **100% interactiva, navegable y funcional en el cliente (Frontend)** de cara a una demostración en vídeo, respetando mi estructura, estilos y código actual sin rehacer el proyecto desde cero.

Necesito que implementes toda la lógica de datos, filtrado avanzado, navegación completa y autenticación simulada siguiendo estos requisitos:

### 1. Enriquecimiento de Datos de Profesores (Mock Data Completo)
Amplía el array/objeto de profesores (mínimo 10-12 perfiles variados de distintas materias e idiomas: Biología, Matemáticas, Inglés, Física, Programación, Historia, Música, Francés, etc.) para que cada objeto tenga todas las propiedades necesarias para filtrar y ordenar:
- `id`, `nombre`, `foto` (URL realista), `materia` (ej: "Biología", "Inglés"), `especialidades` (array de palabras clave, ej: `["Genética", "Selectividad", "Biología celular"]`).
- `precioHora` (número, ej: `18`, `25`, `12`).
- `puntuacion` (número decimal, ej: `4.9`, `4.7`, `5.0`) y `numResenas` (ej: `42`, `18`).
- `distanciaKm` (número, ej: `1.2`, `3.5`, `0.8`, `12.0`) y `ciudad` / `modalidad` (`["Online", "Presencial"]`).
- `bio` corta y disponibilidad.

### 2. Buscador por Palabras Clave + Filtros y Ordenación en Tiempo Real
Haz que el buscador y la barra de filtros trabajen combinados y al instante:
- **Búsqueda inteligente por palabras clave:** Al escribir en el input (ej: *"biología"*, *"genética"*, *"inglés"*, o el nombre del profesor), debe filtrar ignorando tildes y mayúsculas/minúsculas tanto en el nombre, la materia principal, las etiquetas/especialidades y la biografía.
- **Controles de Filtro y Ordenación funcionales:**
  - **Ordenar por:** Cercanía (menor `distanciaKm` primero), Precio (menor a mayor y mayor a menor), y Mejor puntuación (`puntuacion` más alta primero).
  - **Filtros rápidos:** Selector o chips por materia/categoría, rango de precio máximo y modalidad (Presencial / Online), más un botón de "Limpiar filtros" que restablezca todo con una animación suave.
  - Muestra un estado vacío amigable ("No se encontraron profesores con esos filtros") si no hay coincidencias.

### 3. Navegación Total: Cero Botones Muertos
Revisa todos los botones, enlaces de la barra lateral, cabecera y tarjetas para que **absolutamente todo lleve a algún sitio o ejecute una acción real en la interfaz**:
- **Botón "Mensajería" / "Contactar" en la tarjeta de un profesor:** Debe redirigir automáticamente a la vista de Mensajería, abrir (o crear al momento si no existía) el chat con ese profesor concreto, y dejar el cursor listo en el input para escribirle.
- **Botón "Ver perfil" / Clic en tarjeta:** Abre un modal o vista de detalle del profesor con su bio completa, reseñas de ejemplo de alumnos, horarios disponibles y botón para reservar clase o enviar mensaje.
- **Botón "Reservar clase":** Abre un modal interactivo rápido donde elegir día/hora y confirmar la reserva con una notificación visual (toast) de éxito.
- **Enlaces del Sidebar y Header:** Todos deben cambiar la vista activa (`Explorador / Profesores`, `Mensajes`, `Mis Clases / Reservas`, `Favoritos`, `Perfil / Ajustes`) con transiciones fluidas.

### 4. Flujo de Inicio de Sesión y Registro Funcional (Simulado)
- Si el usuario no ha iniciado sesión, los botones de **"Iniciar sesión"** y **"Registrarse"** (en el header o al intentar reservar/guardar favoritos) deben abrir un modal limpio y moderno con pestañas para Login y Registro.
- **Acceso rápido para demo:** Permite iniciar sesión con cualquier email/contraseña (o incluye un botón de *"Entrar como usuario demo"* de un clic) que guarde el estado en `localStorage` / estado de la app.
- **Cambio dinámico en la UI al loguearse:** Al iniciar sesión, la cabecera y la barra lateral deben actualizarse al instante mostrando el avatar del usuario, su nombre, acceso a sus mensajes/reservas y el botón de "Cerrar sesión".


