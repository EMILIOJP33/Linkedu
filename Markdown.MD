🎓 Linkedu — Especificación Técnica y Funcional del Proyecto

Linkedu es una plataforma y red social interactiva pensada para conectar de forma ágil, visual y moderna a todo el ecosistema educativo (docentes, alumnos, colegios y empresas del sector). Se aleja de los portales de empleo o tutorías tradicionales basados en currículums extensos y densos, apostando por una experiencia directa basada en perfiles rápidos, valoraciones, etiquetas e interacción por chat.

1. Visión General del Proyecto

 Propósito

Facilitar el contacto y la colaboración entre profesionales de la educación, estudiantes y entidades educativas a nivel global (presencial u online), eliminando la burocracia de los formatos tradicionales y sustituyéndola por una red de micro-interacciones directa.

 Alcance

Ubicación: Multi-regional/Global (filtrado por país, ciudad o modalidad 100% online).

Público Objetivo:

Docentes: Buscan conectar con otros profesores, encontrar alumnos o postular a proyectos de colegios/empresas.

Alumnos: Buscan docentes según reputación/idiomas o grupos de estudio.

Colegios / Empresas: Buscan docentes especializados para proyectos puntuales o vacantes.

2. Lo Que SÍ Quiere y Lo Que NO Quiere el Proyecto

 LO QUE SÍ QUIERE (Funcionalidades Clave)

Perfiles Flash & Visuales:

Foto de perfil + Titular/Bio de 1 o 2 líneas.

Banderas de idiomas con nivel de dominio (interactivas y muy visuales).

Etiquetas/Badges de competencias (ej. #EdTech, #Bilingüe, #Robótica).

Sistema de Reseñas y Valoraciones: Opiniones de otros usuarios con puntuación por estrellas.

Sistema de Chat Integrado: Punto central de interacción y contacto instantáneo entre usuarios.

Proyectos Colaborativos: Tablero donde usuarios o entidades publican iniciativas educativas (con estados: Buscando Colaboradores, En Curso, Finalizado).

Conexión Docente-Docente: Módulo para que profesores del mismo perfil hagan networking o preparen clases grupales.

Conexión entre Alumnos: Espacio para organizar grupos de estudio o resolver dudas comunes.

Bolsa de Oportunidades: Búsqueda directa por parte de colegios y empresas de perfiles especializados.

Filtros Avanzados: Búsqueda por ubicación física, disponibilidad online, idiomas y especialidad.

 LO QUE NO QUIERE (Líneas Rojas)

NO Currículums extensos ("sin tochos"): Se prohíben las descripciones eternas, PDFs de CV o historiales laborales infinitos.

NO Subida de archivos / Biblioteca de recursos: Se descarta la funcionalidad de compartir documentos, manuales o archivos adjuntos en repositorios. Todo el intercambio de información directa o enlaces se realiza exclusivamente a través del Chat.

NO Formularios complejos de registro: Proceso de alta rápido e intuitivo.

3. Módulos Principales de la Aplicación

[ LINKEDU ]
 ├── 1. Perfiles Flash (Docentes, Alumnos, Colegios)
 ├── 2. Búsqueda y Filtros (Ubicación / Idiomas / Modalidad)
 ├── 3. Tablero de Proyectos Colaborativos
 ├── 4. Red de Conexión (Docente-Docente / Alumno-Alumno)
 ├── 5. Chat en Tiempo Real (Único canal de comunicación)
 └── 6. Oportunidades para Empresas y Colegios


4. Stack Tecnológico Recomendado

Para garantizar un producto moderno, ágil y preparado para escalar sin perder rendimiento:

 Frontend (Interfaz de Usuario)

Framework: React o Next.js (JavaScript / TypeScript).

Ventaja: Renderizado ultra rápido, excelente experiencia de navegación tipo App y facilidad para indexación SEO de perfiles públicos.

Estilos: Tailwind CSS.

Ventaja: Diseños limpios, modernos y minimalistas acordes a la estética ligera deseada.

 Backend (Servidor y Lógica de Negocio)

Entorno: Node.js con Express o Nest.js.

Ventaja: Mismo lenguaje (JavaScript/TypeScript) en frontend y backend, desarrollo rápido y escalable.

Comunicación en Tiempo Real: Socket.io (WebSockets).

Imprescindible: Permite la mensajería del Chat instantáneo sin necesidad de refrescar la pantalla.

 Base de Datos

Motor: PostgreSQL (Relacional).

Ventaja: Manejo óptimo de relaciones entre usuarios, tipos de roles, chats, reseñas y publicaciones de proyectos con máxima integridad.

 Infraestructura y Despliegue

Dominio: Registro en proveedor estándar (linkedu.com o .es).

Hosting Frontend: Vercel o Netlify.

Hosting Backend & BD: Render / Railway / Supabase (para PostgreSQL managed).

5. Diseño Lógico de la Base de Datos (Tablas Clave)

Users (Usuarios)

id (UUID, Primary Key)

role (Enum: 'docente', 'alumno', 'colegio_empresa')

name (VARCHAR)

email (VARCHAR, Unique)

password_hash (VARCHAR)

bio_short (VARCHAR - máximo 160 caracteres)

avatar_url (VARCHAR)

languages (Array / JSON: e.g., [{"code": "ES", "level": "Nativo"}, {"code": "EN", "level": "C1"}])

location_city (VARCHAR)

is_online_available (BOOLEAN)

Projects (Proyectos Colaborativos)

id (UUID, Primary Key)

author_id (Foreign Key -> Users.id)

title (VARCHAR)

description_short (TEXT)

status (Enum: 'buscando', 'en_curso', 'finalizado')

created_at (TIMESTAMP)

Reviews (Reseñas y Valoraciones)

id (UUID, Primary Key)

target_user_id (Foreign Key -> Users.id)

author_user_id (Foreign Key -> Users.id)

rating (INT 1-5)

comment (TEXT - breve)

created_at (TIMESTAMP)

Chats & Messages (Mensajería)

Chats: id, user1_id, user2_id, updated_at

Messages: id, chat_id, sender_id, content (TEXT), sent_at

6. Escalabilidad y Plan de Monetización Futura

Aunque el proyecto inicia como un MVP/trabajo académico, está preparado para monetizarse mediante:

Suscripción Premium para Colegios / Empresas: Cuota periódica para acceder a filtros masivos o destacar ofertas de proyectos en la vista principal.

Perfiles Destacados para Docentes: Opción de pago ligero para aparecer en los primeros resultados de búsqueda en una ubicación geográfica determinada.

Publicidad y Anuncios Segmentados: Inserción no intrusiva de anuncios de marcas o soluciones del sector educativo (EdTech).