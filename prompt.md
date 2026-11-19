Actúa como un desarrollador Frontend Senior y diseñador UI/UX. Tengo una aplicación web ya desarrollada (un marketplace/plataforma educativa) y necesito hacerle una puesta a punto visual y funcional para grabar un vídeo de demostración profesional. 

**Contexto técnico de mi proyecto:**
- Stack actual: [Escribe aquí tu stack, ej: HTML/CSS/JS vanilla, Angular, React, etc.]
- Regla principal: **NO rehagas la web desde cero ni cambies mi estructura base.** Trabaja sobre el código que te voy a pasar/mostrar, respetando mi arquitectura, paleta de colores y tipografías actuales.

Necesito que implementes y corrijas exactamente los siguientes puntos:

### 1. Arreglo y mejora de la Barra Lateral (Sidebar)
- **Scroll funcional:** Actualmente la barra lateral se queda fija y no baja ni sube si el contenido desborda. Añade `overflow-y: auto` (con un scrollbar fino y estético) y asegúrate de que su altura esté bien calculada (`height: 100vh` o `calc(100vh - altura_header)`) para que se pueda hacer scroll independiente sin mover toda la página.
- **Completar enlaces y estados:** Revisa que todos los ítems del menú tengan sentido, iconos alineados y efectos `:hover` y `.active` bien marcados. Haz que al hacer clic en los botones de navegación realmente cambien de vista, hagan scroll suave (`scroll-behavior: smooth`) a su sección o abran el modal correspondiente (cero botones muertos).

### 2. Estética, Micro-interacciones y CSS Pulido
- **Animaciones fluidas:** Añade transiciones suaves (`transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`) en tarjetas, botones, modales y cambios de pestaña para que la navegación se sienta "viva" y moderna al grabarla en vídeo.
- **Acabado profesional:** Mejora el espaciado (padding/margins), sombras sutiles (`box-shadow`), bordes redondeados consistentes y asegúrate de que no haya elementos descuadrados.

### 3. Catálogo de Profesores y Buscador Funcional (Datos Mock)
- Rellena el listado con **8-10 perfiles ficticios pero muy realistas** de profesores de distintos idiomas (Inglés, Francés, Alemán, Japonés, Italiano, Chino, Español para extranjeros, etc.).
- Incluye fotos de perfil reales/profesionales (usa URLs válidas de Unsplash o avatares realistas), precios por hora, valoraciones con estrellas, etiquetas de especialidad y una breve bio.
- **Buscador y filtros operativos:** Haz que la barra de búsqueda y los filtros por idioma funcionen en tiempo real sobre estos datos (si escribo "Japonés" o busco un nombre, debe filtrar las tarjetas al instante con una transición limpia).

### 4. Sistema de Mensajería / Chat Interactivo (Simulado para Demo)
- No necesito conexión real a base de datos para esto, pero sí una **interfaz de chat completamente navegable**:
  - Una bandeja de entrada con 3 o 4 conversaciones de ejemplo con distintos profesores y vistas previas del último mensaje.
  - Al hacer clic en cualquier conversación de la lista (o en el botón "Contactar / Enviar mensaje" de la tarjeta de un profesor), debe abrirse esa conversación en el panel principal del chat.
  - El input de escribir mensaje debe permitir escribir texto y, al darle a Enviar (o Enter), pintar la burbuja del mensaje en pantalla al instante (y opcionalmente simular una respuesta automática tras 1 segundo para que quede genial en el vídeo).

---

