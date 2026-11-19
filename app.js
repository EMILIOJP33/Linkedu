import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const searchInput = document.querySelector("#globalSearch");
const emptyState = document.querySelector("#emptyState");
const tutorGrid = document.querySelector("#tutorGrid");
const bookingDialog = document.querySelector("#bookingDialog");
const authDialog = document.querySelector("#authDialog");
const profileDialog = document.querySelector("#profileDialog");
const authForm = document.querySelector("#authForm");
const profileForm = document.querySelector("#profileForm");
const toast = document.querySelector("#toast");
const categoryButtons = [...document.querySelectorAll(".category-chip")];
const demoCards = [...document.querySelectorAll(".tutor-card")];
const languageFilter = document.querySelector("#languageFilter");
const authMessage = document.querySelector("#authMessage");
const profileMessage = document.querySelector("#profileMessage");
const chatDialog = document.querySelector("#chatDialog");
const studyRoomDialog = document.querySelector("#studyRoomDialog");
const sessionsDialog = document.querySelector("#sessionsDialog");
const videoDialog = document.querySelector("#videoDialog");
let activeCategory = "Todas";
let profiles = [];
let currentUser = null;
let currentProfile = null;
let authMode = "login";
let toastTimer;
let selectedTeacherId = null;
let activeConversationId = null;
let activeChatChannel = null;
let activeMessages = [];
let liveKitRoom = null;
let selectedChatImage = null;
let profilePreviewObjectUrl = null;
let chatPreviewObjectUrl = null;
let favoritesOnly = false;
let favoriteTeacherIds = new Set();

const mockTeachers = [
  { id:"mock-1", nombre:"Noa Díaz", foto:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=720&q=85", materia:"Biología", especialidades:["Genética","Selectividad","Biología celular"], precioHora:22, puntuacion:5.0, numResenas:44, distanciaKm:1.2, ciudad:"Madrid", modalidad:["Online","Presencial"], bio:"Genética, ADN y herencia con esquemas claros y problemas resueltos paso a paso.", disponibilidad:["Lunes 17:00","Miércoles 18:30","Viernes 16:00"] },
  { id:"mock-2", nombre:"Javier Luna", foto:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=85", materia:"Biología", especialidades:["Anatomía","Fisiología","Universidad"], precioHora:24, puntuacion:4.8, numResenas:36, distanciaKm:3.5, ciudad:"Madrid", modalidad:["Online"], bio:"Anatomía y fisiología con material visual y técnicas para memorizar sin estrés.", disponibilidad:["Martes 19:00","Jueves 18:00","Sábado 11:00"] },
  { id:"mock-3", nombre:"Marcos Ruiz", foto:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=85", materia:"Matemáticas", especialidades:["Álgebra","Física","Bachillerato"], precioHora:22, puntuacion:5.0, numResenas:52, distanciaKm:0.8, ciudad:"Madrid", modalidad:["Online","Presencial"], bio:"Explico problemas complejos paso a paso y preparo exámenes con ejercicios reales.", disponibilidad:["Lunes 16:00","Miércoles 17:30","Sábado 10:00"] },
  { id:"mock-4", nombre:"Laura Gil", foto:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=720&q=85", materia:"Matemáticas", especialidades:["Álgebra","Primaria","ESO"], precioHora:17, puntuacion:4.9, numResenas:44, distanciaKm:2.1, ciudad:"Getafe", modalidad:["Online","Presencial"], bio:"Álgebra visual con ejemplos cercanos para quitar el miedo a los números.", disponibilidad:["Martes 16:00","Jueves 17:00","Viernes 18:00"] },
  { id:"mock-5", nombre:"Sofía Martínez", foto:"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=720&q=85", materia:"Inglés", especialidades:["Conversación","Entrevistas","Inglés C2"], precioHora:18, puntuacion:4.9, numResenas:38, distanciaKm:1.8, ciudad:"Madrid", modalidad:["Online"], bio:"Clases cercanas y dinámicas para ganar fluidez, confianza y soltura en entrevistas.", disponibilidad:["Lunes 18:00","Miércoles 19:00","Viernes 17:00"] },
  { id:"mock-6", nombre:"Camille Dubois", foto:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=720&q=85", materia:"Francés", especialidades:["Conversación","DELF","Pronunciación"], precioHora:19, puntuacion:4.9, numResenas:41, distanciaKm:12.0, ciudad:"Barcelona", modalidad:["Online"], bio:"Perfecciona tu pronunciación y vive el francés con clases culturales y naturales.", disponibilidad:["Martes 18:30","Jueves 20:00","Domingo 11:00"] },
  { id:"mock-7", nombre:"Ivo Martín", foto:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=720&q=85", materia:"Historia", especialidades:["Historia antigua","Roma","Egipto"], precioHora:18, puntuacion:4.8, numResenas:30, distanciaKm:4.6, ciudad:"Alcorcón", modalidad:["Online","Presencial"], bio:"Civilizaciones antiguas narradas con cronologías visuales y mapas.", disponibilidad:["Miércoles 16:30","Viernes 18:00","Sábado 12:00"] },
  { id:"mock-8", nombre:"Lucía Mora", foto:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=720&q=85", materia:"Lengua", especialidades:["Literatura","Sintaxis","Comentarios de texto"], precioHora:19, puntuacion:4.9, numResenas:42, distanciaKm:2.8, ciudad:"Madrid", modalidad:["Online","Presencial"], bio:"Literatura, sintaxis y comentarios de texto con técnicas fáciles de recordar.", disponibilidad:["Lunes 17:30","Martes 19:00","Jueves 16:00"] },
  { id:"mock-9", nombre:"David Chen", foto:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=85", materia:"Programación", especialidades:["JavaScript","React","Desarrollo web"], precioHora:26, puntuacion:5.0, numResenas:58, distanciaKm:5.2, ciudad:"Leganés", modalidad:["Online"], bio:"Crea proyectos reales aprendiendo JavaScript, React y buenas prácticas desde cero.", disponibilidad:["Martes 20:00","Jueves 19:30","Sábado 17:00"] },
  { id:"mock-10", nombre:"Andrea León", foto:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=720&q=85", materia:"Conocimiento del medio", especialidades:["Naturaleza","Medio ambiente","Experimentos"], precioHora:17, puntuacion:5.0, numResenas:47, distanciaKm:1.5, ciudad:"Madrid", modalidad:["Online","Presencial"], bio:"Naturaleza y medio ambiente mediante experimentos visuales y curiosidades.", disponibilidad:["Lunes 16:30","Jueves 17:30","Viernes 16:00"] },
  { id:"mock-11", nombre:"Inés Navarro", foto:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=85", materia:"Diseño", especialidades:["Ilustración","Figma","Portfolio"], precioHora:20, puntuacion:4.8, numResenas:27, distanciaKm:3.1, ciudad:"Madrid", modalidad:["Online"], bio:"Te ayudo a encontrar tu estilo, construir un portfolio y desarrollar proyectos originales.", disponibilidad:["Martes 17:00","Miércoles 18:30","Domingo 12:00"] },
  { id:"mock-12", nombre:"Aiko Tanaka", foto:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=720&q=85", materia:"Japones", especialidades:["JLPT","Kanji","Conversación"], precioHora:24, puntuacion:5.0, numResenas:46, distanciaKm:8.4, ciudad:"Madrid", modalidad:["Online"], bio:"Aprende japonés desde cero con kanji, conversación y claves culturales prácticas.", disponibilidad:["Lunes 20:00","Miércoles 20:00","Sábado 11:30"] },
];
const demoConversations = [
  { id: "demo-sofia", partnerId: "demo-sofia", name: "Sofía Martínez", preview: "¡Claro! Podemos empezar por conversación.", messages: [
    { id: "demo-sofia-1", sender_id: "demo-sofia", content: "Hola, encantada de ayudarte con tu inglés.", created_at: "2026-11-19T09:30:00" },
    { id: "demo-sofia-2", sender_id: "demo-me", content: "Me gustaría mejorar mi fluidez para entrevistas.", created_at: "2026-11-19T09:32:00" },
    { id: "demo-sofia-3", sender_id: "demo-sofia", content: "¡Claro! Podemos empezar por conversación.", created_at: "2026-11-19T09:33:00" },
  ] },
  { id: "demo-marcos", partnerId: "demo-marcos", name: "Marcos Ruiz", preview: "La próxima clase puede ser de física.", messages: [
    { id: "demo-marcos-1", sender_id: "demo-marcos", content: "Hola, ¿qué tema te gustaría reforzar?", created_at: "2026-11-18T18:10:00" },
    { id: "demo-marcos-2", sender_id: "demo-me", content: "Tengo dudas con cinemática y dinámica.", created_at: "2026-11-18T18:12:00" },
    { id: "demo-marcos-3", sender_id: "demo-marcos", content: "La próxima clase puede ser de física.", created_at: "2026-11-18T18:13:00" },
  ] },
  { id: "demo-aiko", partnerId: "demo-aiko", name: "Aiko Tanaka", preview: "Podemos preparar el nivel N5 juntos.", messages: [
    { id: "demo-aiko-1", sender_id: "demo-me", content: "Hola Aiko, estoy empezando con japonés.", created_at: "2026-11-17T12:02:00" },
    { id: "demo-aiko-2", sender_id: "demo-aiko", content: "Perfecto, podemos preparar el nivel N5 juntos.", created_at: "2026-11-17T12:05:00" },
  ] },
  { id: "demo-david", partnerId: "demo-david", name: "David Chen", preview: "¿Quieres que revisemos tu proyecto web?", messages: [
    { id: "demo-david-1", sender_id: "demo-david", content: "¿Quieres que revisemos tu proyecto web?", created_at: "2026-11-16T16:40:00" },
  ] },
];

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

function mockTeacherCardMarkup(teacher) {
  const specialities = teacher.especialidades.slice(0, 2).map((item) => `<span>${escapeHTML(item)}</span>`).join("");
  const modalities = teacher.modalidad.map((item) => `<span>${escapeHTML(item)}</span>`).join("");
  return `<article class="tutor-card mock-card" data-mock-id="${teacher.id}" data-category="${escapeHTML(teacher.materia)}" data-name="${escapeHTML(normalize(`${teacher.nombre} ${teacher.materia} ${teacher.especialidades.join(" ")} ${teacher.bio}`))}">
    <div class="tutor-photo tutor-dynamic">
      <img class="tutor-profile-image" src="${escapeHTML(teacher.foto)}" alt="${escapeHTML(teacher.nombre)}" loading="lazy" />
      <span class="online-status" aria-label="Disponible"></span>
      <button class="favorite-button" data-favorite-id="${teacher.id}" aria-label="Guardar a ${escapeHTML(teacher.nombre)} en favoritos" aria-pressed="false">♡</button>
    </div>
    <div class="tutor-info">
      <button class="tutor-profile-link" type="button" data-action="profile" data-teacher-id="${teacher.id}" aria-label="Ver perfil de ${escapeHTML(teacher.nombre)}">
        <div class="tutor-title-row"><div><h3>${escapeHTML(teacher.nombre)}</h3><p>${escapeHTML(teacher.materia)} · ${escapeHTML(teacher.especialidades[0])}</p></div><div class="rating">★ <strong>${teacher.puntuacion.toFixed(1)}</strong> <span>(${teacher.numResenas})</span></div></div>
      </button>
      <div class="tutor-tags">${specialities}${modalities}</div>
      <p class="tutor-bio">${escapeHTML(teacher.bio)}</p>
      <div class="tutor-bottom">
        <span class="tutor-price"><strong>${teacher.precioHora} €</strong> <small>/ hora</small></span>
        <button class="tutor-contact demo-contact" data-teacher="${escapeHTML(teacher.nombre)}" type="button">Mensaje</button>
        <button class="button button-small" data-action="quick-book" data-teacher-id="${teacher.id}" type="button">Reservar <span aria-hidden="true">→</span></button>
      </div>
    </div>
  </article>`;
}

function renderMockTeachers(list = mockTeachers) {
  tutorGrid.innerHTML = list.map(mockTeacherCardMarkup).join("");
  bindFavoriteButtons();
  filterTutors();
}

function bindFavoriteButtons() {
  document.querySelectorAll("[data-favorite-id]").forEach((button) => {
    const savedAtLoad = favoriteTeacherIds.has(button.dataset.favoriteId);
    button.classList.toggle("saved", savedAtLoad);
    button.textContent = savedAtLoad ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(savedAtLoad));
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!currentUser) {
        openAuthDialog("signup");
        showToast("Inicia sesión para guardar favoritos.");
        return;
      }
      const saved = button.classList.toggle("saved");
      button.textContent = saved ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(saved));
      if (saved) favoriteTeacherIds.add(button.dataset.favoriteId);
      else favoriteTeacherIds.delete(button.dataset.favoriteId);
      localStorage.setItem("linkedu_demo_favorites", JSON.stringify([...favoriteTeacherIds]));
      const teacher = mockTeachers.find((item) => item.id === button.dataset.favoriteId);
      if (saved) showToast(`${teacher?.nombre ?? "Docente"} añadido a favoritos.`);
      if (!saved) showToast(`${teacher?.nombre ?? "Docente"} eliminado de favoritos.`);
    });
  });
}

let selectedMockTeacher = null;

function openMockTeacherProfile(teacherId) {
  const teacher = mockTeachers.find((item) => item.id === teacherId);
  if (!teacher) return;
  selectedMockTeacher = teacher;
  document.querySelector("#teacherProfilePhoto").src = teacher.foto;
  document.querySelector("#teacherProfilePhoto").alt = teacher.nombre;
  document.querySelector("#teacherProfileTitle").textContent = teacher.nombre;
  document.querySelector("#teacherProfileSubject").textContent = `${teacher.materia} · ${teacher.especialidades.join(" · ")}`;
  document.querySelector("#teacherProfileBio").textContent = teacher.bio;
  document.querySelector("#teacherProfileMeta").innerHTML = `<span>★ ${teacher.puntuacion.toFixed(1)} · ${teacher.numResenas} reseñas</span><span>${teacher.precioHora} €/hora</span><span>${teacher.ciudad} · ${teacher.distanciaKm} km</span><span>${teacher.modalidad.join(" · ")}</span>`;
  document.querySelector("#teacherProfileAvailability").innerHTML = teacher.disponibilidad.map((slot, index) =>
    `<button type="button" class="${index === 0 ? "active" : ""}" data-slot="${escapeHTML(slot)}">${escapeHTML(slot)}</button>`).join("");
  document.querySelector("#teacherProfileReviews").innerHTML = `
    <article><strong>María L.</strong> · ★★★★★<br />Muy buena explicación y mucho cariño con los conceptos.</article>
    <article><strong>Álex R.</strong> · ★★★★★<br />Las clases son claras, prácticas y el ambiente es muy cómodo.</article>`;
  document.querySelector("#teacherProfileDialog").showModal();
}

function openMockBooking(teacherId) {
  const teacher = mockTeachers.find((item) => item.id === teacherId);
  if (!teacher) return;
  if (!currentUser) {
    openAuthDialog("login");
    showToast("Inicia sesión para reservar una clase.");
    return;
  }
  selectedMockTeacher = teacher;
  document.querySelector("#mockBookingTeacher").textContent = teacher.nombre;
  const dateInput = document.querySelector("#mockBookingDate");
  const minimum = new Date(Date.now() + 24 * 60 * 60_000);
  dateInput.min = localDateTimeValue(minimum);
  dateInput.value = localDateTimeValue(minimum);
  document.querySelector("#mockBookingMessage").textContent = "";
  document.querySelector("#mockBookingDialog").showModal();
}

document.querySelector("#teacherProfileAvailability")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot]");
  if (!button) return;
  document.querySelectorAll("#teacherProfileAvailability button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
});

document.querySelector("#teacherProfileMessage")?.addEventListener("click", () => {
  if (!selectedMockTeacher) return;
  document.querySelector("#teacherProfileDialog").close();
  openConversationWithTeacher(null, selectedMockTeacher.nombre);
});

document.querySelector("#teacherProfileBook")?.addEventListener("click", () => {
  if (!selectedMockTeacher) return;
  const teacherId = selectedMockTeacher.id;
  document.querySelector("#teacherProfileDialog").close();
  openMockBooking(teacherId);
});

document.querySelector("#mockBookingForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const dateInput = document.querySelector("#mockBookingDate");
  if (!dateInput.value) return;
  const selectedDate = new Date(dateInput.value);
  if (!Number.isFinite(selectedDate.getTime()) || selectedDate <= new Date()) {
    document.querySelector("#mockBookingMessage").textContent = "Elige una fecha y hora futuras.";
    return;
  }
  document.querySelector("#mockBookingDialog").close();
  showToast(`Reserva confirmada con ${selectedMockTeacher?.nombre ?? "el docente"} para ${selectedDate.toLocaleString("es-ES", { dateStyle:"medium", timeStyle:"short" })}.`);
});

function updateDates() {
  const now = new Date();
  document.querySelector("#currentDate").textContent = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4200);
}

function normalize(value = "") {
  return value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function categoryMatches(profile, category) {
  if (category === "Todas") return true;
  const value = normalize(`${profile.subject ?? ""} ${profile.headline ?? ""}`);
  const keywords = {
    Idiomas: ["idioma", "ingles", "espanol", "frances", "aleman", "italiano", "conversacion", "language"],
    Ciencias: ["ciencia", "matemat", "fisica", "quimica", "biologia", "tecnologia", "programacion"],
    Informática: ["informatica", "computacion", "programacion", "codigo", "software", "desarrollo web", "tecnologia", "robotica"],
    Matemáticas: ["matemat", "algebra", "calculo", "geometria", "estadistica", "trigonometria", "probabilidad"],
    Lengua: ["lengua", "literatura", "ortografia", "gramatica", "redaccion", "sintaxis", "lectura"],
    "Conocimiento del medio": ["medio", "naturaleza", "geografia", "ecosistema", "cuerpo humano", "ciencias naturales", "salud"],
    Historia: ["historia", "geografia", "arte medieval", "civilizacion", "cronologia"],
    Biología: ["biologia", "genetica", "celula", "ecologia", "evolucion", "zoologia", "anatomia"],
    Diseño: ["diseno", "ilustracion", "arte", "creatividad", "grafico"],
    Música: ["musica", "piano", "guitarra", "canto", "instrumento"],
    Tecnología: ["tecnologia", "programacion", "codigo", "informatica", "robotica"],
  };
  return (keywords[category] ?? [normalize(category)]).some((keyword) => value.includes(keyword));
}

function safeAvatarURL(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function validateImageFile(file, maxBytes) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Elige una imagen JPG, PNG o WebP.");
  }
  if (file.size > maxBytes) {
    throw new Error(`La imagen no puede superar ${Math.floor(maxBytes / (1024 * 1024))} MB.`);
  }
}

function getStoredAvatarPath(value) {
  if (!value || !supabase) return null;
  const publicBase = supabase.storage.from("profile-avatars").getPublicUrl("").data.publicUrl;
  const prefix = publicBase.endsWith("/") ? publicBase : `${publicBase}/`;
  if (!value.startsWith(prefix)) return null;
  try {
    return decodeURIComponent(value.slice(prefix.length));
  } catch {
    return null;
  }
}

function showProfileAvatarPreview(source) {
  const preview = document.querySelector("#profileAvatarPreview");
  const image = document.querySelector("#profileAvatarPreviewImage");
  preview.hidden = !source;
  image.src = source || "";
}

function clearChatAttachment() {
  selectedChatImage = null;
  if (chatPreviewObjectUrl) URL.revokeObjectURL(chatPreviewObjectUrl);
  chatPreviewObjectUrl = null;
  document.querySelector("#chatImageFile").value = "";
  document.querySelector("#chatAttachmentPreview").hidden = true;
  document.querySelector("#chatAttachmentPreviewImage").removeAttribute("src");
  document.querySelector("#chatAttachmentName").textContent = "";
}

function profileCardMarkup(profile) {
  const name = escapeHTML(profile.full_name || "Docente");
  const subject = escapeHTML(profile.subject || profile.headline || "Docente");
  const price = profile.hourly_rate !== null && Number.isFinite(Number(profile.hourly_rate))
    ? `${Number(profile.hourly_rate).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
    : "Consultar";
  const location = profile.online_available ? "Online" : escapeHTML(profile.city || "Presencial");
  const avatarURL = safeAvatarURL(profile.avatar_url);
  const initials = escapeHTML((profile.full_name || "D").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase());
  const languageTags = (profile.languages ?? []).slice(0, 1).map(escapeHTML);
  const avatar = avatarURL
    ? `<img class="tutor-profile-image" src="${escapeHTML(avatarURL)}" alt="" loading="lazy" />`
    : `<span class="profile-initials">${initials}</span>`;
  const tag = languageTags.length ? `<span>${languageTags[0]}</span>` : "";
  const isPromoted = profile.promoted_from
    && profile.promoted_until
    && Date.parse(profile.promoted_from) <= Date.now()
    && Date.parse(profile.promoted_until) > Date.now();

  return `<article class="tutor-card${isPromoted ? " promoted-card" : ""}" data-profile-id="${escapeHTML(profile.id)}" data-promoted="${isPromoted ? "true" : "false"}" data-category="${escapeHTML(profile.subject ?? "")}" data-language="${escapeHTML((profile.languages ?? []).join(" "))}" data-name="${escapeHTML(normalize(`${profile.full_name ?? ""} ${profile.subject ?? ""} ${profile.headline ?? ""}`))}">
    <div class="tutor-photo tutor-dynamic">${isPromoted ? '<span class="promoted-badge">⭐ Docente destacado</span>' : ""}${avatar}<span class="online-status" aria-label="Perfil publicado"></span></div>
    <div class="tutor-info">
      <div class="tutor-title-row"><div><h3>${name}</h3><p>${subject}</p></div><div class="rating"><strong>Nuevo</strong></div></div>
      <div class="tutor-tags">${tag}<span>${location}</span></div>
      <div class="tutor-bottom"><span class="tutor-price"><strong>${price}</strong> <small>${price === "Consultar" ? "" : "/ hora"}</small></span><button class="button button-small book-button" data-action="book" data-teacher-id="${escapeHTML(profile.id)}" data-teacher="${name}" type="button">Reservar <span aria-hidden="true">→</span></button><button class="tutor-contact" data-action="contact" data-teacher-id="${escapeHTML(profile.id)}" data-teacher="${name}" type="button">Chat</button></div>
    </div>
  </article>`;
}

function filterTutors() {
  const query = normalize(searchInput.value.trim());
  const selectedLanguage = languageFilter?.value ?? "Todos";
  const sortValue = document.querySelector("#sortTeachers")?.value ?? "destacado";
  const maxPrice = Number(document.querySelector("#maxPrice")?.value ?? 0);
  const modality = document.querySelector("#teacherModality")?.value ?? "Todas";
  let visibleCount = 0;

  if (isSupabaseConfigured) {
    for (const card of tutorGrid.querySelectorAll(".tutor-card")) {
      const profile = profiles.find((item) => item.id === card.dataset.profileId);
      const searchable = normalize(`${profile?.full_name ?? ""} ${profile?.subject ?? ""} ${profile?.headline ?? ""} ${profile?.city ?? ""} ${(profile?.languages ?? []).join(" ")}`);
      const languages = (profile?.languages ?? []).join(" ");
      const languageMatches = selectedLanguage === "Todos"
        || normalize(languages).includes(normalize(selectedLanguage))
        || normalize(profile?.subject ?? "").includes(normalize(selectedLanguage));
      const visible = Boolean(profile) && categoryMatches(profile, activeCategory) && languageMatches && (!query || searchable.includes(query));
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    }
  } else {
    let sortedTeachers = [...mockTeachers];
    if (sortValue === "distancia") sortedTeachers.sort((a, b) => a.distanciaKm - b.distanciaKm);
    if (sortValue === "precio-asc") sortedTeachers.sort((a, b) => a.precioHora - b.precioHora);
    if (sortValue === "precio-desc") sortedTeachers.sort((a, b) => b.precioHora - a.precioHora);
    if (sortValue === "puntuacion") sortedTeachers.sort((a, b) => b.puntuacion - a.puntuacion);
    const cardsById = new Map([...tutorGrid.querySelectorAll(".tutor-card")].map((card) => [card.dataset.mockId, card]));
    for (const teacher of sortedTeachers) {
      const card = cardsById.get(teacher.id);
      if (card) tutorGrid.append(card);
    }
    for (const card of tutorGrid.querySelectorAll(".tutor-card")) {
      const teacher = mockTeachers.find((item) => item.id === card.dataset.mockId);
      if (!teacher) continue;
      const searchable = normalize(`${teacher.nombre} ${teacher.materia} ${teacher.especialidades.join(" ")} ${teacher.bio}`);
      const languageMatches = selectedLanguage === "Todos"
        || normalize(`${teacher.materia} ${teacher.especialidades.join(" ")} ${teacher.nombre}`).includes(normalize(selectedLanguage));
      const priceMatches = !maxPrice || teacher.precioHora <= maxPrice;
      const modalityMatches = modality === "Todas" || teacher.modalidad.includes(modality);
      const visible = (activeCategory === "Todas" || normalize(teacher.materia).includes(normalize(activeCategory)))
        && (!query || searchable.includes(query))
        && languageMatches
        && priceMatches
        && modalityMatches
        && (!favoritesOnly || card.querySelector(".favorite-button")?.classList.contains("saved"));
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    }
  }

  emptyState.hidden = visibleCount > 0;
  if (isSupabaseConfigured && profiles.length === 0) {
    emptyState.textContent = "Aún no hay docentes con perfil público. ¡Vuelve pronto!";
  } else {
    emptyState.textContent = "No se encontraron profesores con esos filtros.";
  }
}

async function loadPublicProfiles() {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase.rpc("list_public_teachers");

  if (error) throw error;
  profiles = (data ?? []).sort((a, b) => {
    const aPromoted = a.promoted_from && a.promoted_until
      && Date.parse(a.promoted_from) <= Date.now() && Date.parse(a.promoted_until) > Date.now();
    const bPromoted = b.promoted_from && b.promoted_until
      && Date.parse(b.promoted_from) <= Date.now() && Date.parse(b.promoted_until) > Date.now();
    return Number(bPromoted) - Number(aPromoted);
  });
  tutorGrid.innerHTML = profiles.map(profileCardMarkup).join("");
  filterTutors();
}

async function invokeFunction(name, body) {
  if (!supabase) throw new Error("Conecta Supabase y sus Edge Functions antes de usar este servicio.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    const response = error.context;
    if (response && typeof response === "object" && typeof response.clone === "function") {
      try {
        const responseText = await response.clone().text();
        if (responseText) {
          try {
            const responseBody = JSON.parse(responseText);
            message = responseBody.error || responseBody.message || message;
          } catch {
            message = responseText.slice(0, 500);
          }
        }
        if (response.status) message = `${message} (HTTP ${response.status})`;
      } catch {
        message = error.message;
      }
    }
    throw new Error(message);
  }
  return data;
}

function requireSignedIn(message = "Inicia sesión para continuar.") {
  if (currentUser) return true;
  openAuthDialog("signup");
  showToast(message);
  return false;
}

function localDateTimeValue(date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function openBooking(teacherId, teacherName, price) {
  if (!requireSignedIn("Crea una cuenta para reservar una clase.")) return;
  if (!teacherId) {
    showToast("Los docentes de ejemplo no admiten reservas. Configura Supabase y publica un perfil real.");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    showToast("Este docente aún no ha indicado un precio por hora.");
    return;
  }
  selectedTeacherId = teacherId;
  document.querySelector("#selectedTeacher").textContent = teacherName;
  document.querySelector("#bookingPrice").textContent = `${price.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.querySelector("#bookingMessage").textContent = "";
  const start = document.querySelector("#lessonStart");
  const now = new Date(Date.now() + 15 * 60_000);
  start.min = localDateTimeValue(now);
  start.max = localDateTimeValue(new Date(Date.now() + 90 * 24 * 60 * 60_000));
  start.value = localDateTimeValue(new Date(Date.now() + 24 * 60 * 60_000));
  bookingDialog.showModal();
}

async function startCheckout(functionName, body) {
  const result = await invokeFunction(functionName, body);
  if (!result?.url || typeof result.url !== "string") {
    throw new Error("El proveedor de pagos no devolvió un enlace de pago.");
  }
  const checkoutUrl = new URL(result.url);
  if (checkoutUrl.protocol !== "https:" || !(checkoutUrl.hostname === "stripe.com" || checkoutUrl.hostname.endsWith(".stripe.com"))) {
    throw new Error("El enlace de pago recibido no es válido.");
  }
  window.location.assign(checkoutUrl.href);
}

async function connectTeacherPayouts() {
  if (!requireSignedIn("Inicia sesión para configurar los cobros.")) return;
  if (currentProfile?.role !== "docente") {
    showToast("Guarda primero tu perfil como docente.");
    return;
  }
  const button = document.querySelector("#payoutSetupButton");
  button.disabled = true;
  try {
    const result = await invokeFunction("connect-teacher", {});
    const url = new URL(result.url);
    if (url.protocol !== "https:" || !(url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"))) {
      throw new Error("Stripe devolvió un enlace de configuración no válido.");
    }
    window.location.assign(url.href);
  } catch (error) {
    const message = /failed to send a request to the edge function/i.test(error.message)
      ? "No se pudo contactar con connect-teacher. Comprueba que la función esté desplegada y que STRIPE_SECRET_KEY y APP_URL estén configurados en Supabase → Edge Functions → Secrets."
      : error.message;
    profileMessage.textContent = `No se pudo iniciar Stripe Connect: ${message}`;
  } finally {
    button.disabled = false;
  }
}

function statusLabel(status) {
  const labels = {
    pending_payment: "Pendiente de pago",
    confirmed: "Confirmada",
    joined: "Plaza pagada",
    cancelled: "Cancelada",
    completed: "Completada",
    refund_pending: "Reembolso iniciado",
    refunded: "Reembolsada",
  };
  return labels[status] ?? status;
}

async function loadMySessions() {
  const list = document.querySelector("#sessionList");
  const message = document.querySelector("#sessionsMessage");
  list.replaceChildren();
  message.textContent = "";
  if (!requireSignedIn("Inicia sesión para ver tus reservas.")) return;

  const [asStudent, asTeacher, roomMemberships] = await Promise.all([
    supabase.from("bookings").select("id, student_id, teacher_id, starts_at, ends_at, amount_cents, status").eq("student_id", currentUser.id).order("starts_at", { ascending: true }).limit(50),
    supabase.from("bookings").select("id, student_id, teacher_id, starts_at, ends_at, amount_cents, status").eq("teacher_id", currentUser.id).order("starts_at", { ascending: true }).limit(50),
    supabase.from("study_room_members").select("room_id, status").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const failedQuery = [asStudent, asTeacher, roomMemberships].find((result) => result.error);
  if (failedQuery?.error) throw failedQuery.error;

  const bookings = [...(asStudent.data ?? []), ...(asTeacher.data ?? [])]
    .filter((booking, index, all) => all.findIndex((item) => item.id === booking.id) === index)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const personIds = [...new Set(bookings.map((booking) => booking.student_id === currentUser.id ? booking.teacher_id : booking.student_id))];
  const namesById = new Map();
  const roomIds = [...new Set((roomMemberships.data ?? []).map((membership) => membership.room_id))];
  const roomsById = new Map();
  if (roomIds.length) {
    const { data: rooms, error } = await supabase.from("study_rooms")
      .select("id, title, starts_at, duration_minutes, status")
      .in("id", roomIds);
    if (error) throw error;
    for (const room of rooms ?? []) roomsById.set(room.id, room);
  }
  if (personIds.length) {
    const { data: people, error } = await supabase.from("profiles").select("id, full_name").in("id", personIds);
    if (error) throw error;
    for (const person of people ?? []) namesById.set(person.id, person.full_name);
  }

  const nextBooking = bookings.find((booking) => booking.status === "confirmed" && Date.parse(booking.ends_at) > Date.now());
  if (nextBooking) {
    const isTeacher = nextBooking.teacher_id === currentUser.id;
    const personId = isTeacher ? nextBooking.student_id : nextBooking.teacher_id;
    const starts = new Date(nextBooking.starts_at);
    document.querySelector("#upcomingDateNumber").textContent = new Intl.DateTimeFormat("es-ES", { day: "2-digit" }).format(starts);
    document.querySelector("#upcomingDateMonth").textContent = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(starts).replace(".", "").toUpperCase();
    document.querySelector("#upcomingClassTitle").textContent = "Clase online";
    document.querySelector("#upcomingClassPartner").textContent = `con ${namesById.get(personId) || "participante"}`;
    document.querySelector("#upcomingDateTime").textContent = starts.toLocaleString("es-ES", { weekday: "long", hour: "2-digit", minute: "2-digit" });
    document.querySelector("#countdownLabel").textContent = "Reserva confirmada";
    document.querySelector("#classProgress").hidden = false;
  } else {
    document.querySelector("#upcomingDateNumber").textContent = "—";
    document.querySelector("#upcomingDateMonth").textContent = "—";
    document.querySelector("#upcomingClassTitle").textContent = "Aún no tienes clases";
    document.querySelector("#upcomingClassPartner").textContent = "Tus reservas aparecerán aquí";
    document.querySelector("#upcomingDateTime").textContent = "";
    document.querySelector("#countdownLabel").textContent = "Reserva clases desde los perfiles";
    document.querySelector("#classProgress").hidden = true;
  }

  for (const booking of bookings) {
    const isTeacher = booking.teacher_id === currentUser.id;
    const participantId = isTeacher ? booking.student_id : booking.teacher_id;
    const item = document.createElement("article");
    item.className = "session-item";
    const refundable = booking.status === "confirmed" && Date.parse(booking.starts_at) - Date.now() >= 24 * 60 * 60_000;
    item.innerHTML = `<div class="session-item-copy"><strong>${escapeHTML(isTeacher ? "Clase con " + (namesById.get(participantId) || "alumno") : "Clase con " + (namesById.get(participantId) || "docente"))}</strong><span>${new Date(booking.starts_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })} · ${Number(booking.amount_cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span></div><span class="session-status ${["pending_payment", "refund_pending"].includes(booking.status) ? "pending" : ""}">${statusLabel(booking.status)}</span>${booking.status === "confirmed" ? `<button class="button button-small join-session" data-booking-id="${escapeHTML(booking.id)}" data-title="Clase con ${escapeHTML(namesById.get(participantId) || "docente")}">Videollamada</button>${refundable ? `<button class="tutor-contact cancel-booking" data-booking-id="${escapeHTML(booking.id)}" type="button">Cancelar y reembolsar</button>` : ""}` : ""}`;
    list.append(item);
  }

  for (const membership of roomMemberships.data ?? []) {
    const room = roomsById.get(membership.room_id);
    if (!room) continue;
    const item = document.createElement("article");
    item.className = "session-item";
    const refundable = membership.status === "joined" && Date.parse(room.starts_at) - Date.now() >= 24 * 60 * 60_000;
    item.innerHTML = `<div class="session-item-copy"><strong>${escapeHTML(room.title)}</strong><span>${new Date(room.starts_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })} · ${room.duration_minutes / 60} h · código ${escapeHTML(room.id)}</span></div><span class="session-status ${["pending_payment", "refund_pending"].includes(membership.status) ? "pending" : ""}">${statusLabel(membership.status)}</span>${membership.status === "joined" ? `<button class="button button-small join-room-video" data-room-id="${escapeHTML(room.id)}" data-title="${escapeHTML(room.title)}">Videollamada</button><button class="tutor-contact copy-room-code" data-room-id="${escapeHTML(room.id)}" type="button">Copiar código</button>${refundable ? `<button class="tutor-contact cancel-room" data-room-id="${escapeHTML(room.id)}" type="button">Cancelar y reembolsar</button>` : ""}` : ""}`;
    list.append(item);
  }

  if (!list.childElementCount) {
    list.innerHTML = '<p class="empty-state">Todavía no tienes reservas o plazas de estudio.</p>';
  }
  if (!sessionsDialog.open) sessionsDialog.showModal();
}

async function loadStudyRooms() {
  const list = document.querySelector("#roomList");
  list.replaceChildren();
  if (!isSupabaseConfigured) {
    list.innerHTML = `
      <article class="room-item"><div class="room-item-copy"><strong>Repaso de Biología</strong><span>Hoy · 18:00 · 1 h · hasta 8 personas</span></div><button class="button button-small room-join-action demo-room-action" type="button">Unirme · 2 €</button></article>
      <article class="room-item"><div class="room-item-copy"><strong>Preparar examen de Lengua</strong><span>Hoy · 19:30 · 2 h · hasta 6 personas</span></div><button class="button button-small room-join-action demo-room-action" type="button">Unirme · 4 €</button></article>
      <article class="room-item"><div class="room-item-copy"><strong>Programación con JavaScript</strong><span>Mañana · 17:00 · 1 h · hasta 10 personas</span></div><button class="button button-small room-join-action demo-room-action" type="button">Unirme · 2 €</button></article>`;
    return;
  }
  if (!supabase || !currentUser) {
    list.innerHTML = '<p class="dialog-note">Inicia sesión para ver las salas disponibles.</p>';
    return;
  }
  const { data, error } = await supabase.from("study_rooms")
    .select("id, host_id, title, starts_at, duration_minutes, capacity")
    .eq("status", "scheduled")
    .gte("starts_at", new Date(Date.now() + 15 * 60_000).toISOString())
    .order("starts_at", { ascending: true })
    .limit(12);
  if (error) throw error;

  for (const room of data ?? []) {
    const item = document.createElement("article");
    item.className = "room-item";
    const isHost = room.host_id === currentUser.id;
    item.innerHTML = `<div class="room-item-copy"><strong>${escapeHTML(room.title)}</strong><span>${new Date(room.starts_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })} · ${room.duration_minutes / 60} h · hasta ${room.capacity} personas</span>${isHost ? `<span class="room-code">Tu código: ${escapeHTML(room.id)}</span>` : ""}</div>${isHost ? '<span class="session-status">Tu sala</span>' : `<button class="button button-small room-join-action" data-room-id="${escapeHTML(room.id)}" type="button">Unirme · ${room.duration_minutes / 60 * 2} €</button>`}`;
    list.append(item);
  }
  if (!list.childElementCount) list.innerHTML = '<p class="dialog-note">Aún no hay salas publicadas. ¡Crea la primera!</p>';
}

async function openStudyRoomDialog() {
  if (!isSupabaseConfigured) {
    if (!currentUser) {
      openAuthDialog("login");
      showToast("Inicia sesión para crear o unirte a salas de estudio.");
      return;
    }
    const start = document.querySelector("#roomStart");
    const minimum = new Date(Date.now() + 15 * 60_000);
    start.min = localDateTimeValue(minimum);
    start.max = localDateTimeValue(new Date(Date.now() + 90 * 24 * 60 * 60_000));
    start.value = localDateTimeValue(new Date(Date.now() + 60 * 60_000));
    document.querySelector("#studyRoomMessage").textContent = "";
    await loadStudyRooms();
    studyRoomDialog.showModal();
    return;
  }
  if (!requireSignedIn("Inicia sesión para crear o unirte a salas de estudio.")) return;
  const start = document.querySelector("#roomStart");
  const minimum = new Date(Date.now() + 15 * 60_000);
  start.min = localDateTimeValue(minimum);
  start.max = localDateTimeValue(new Date(Date.now() + 90 * 24 * 60 * 60_000));
  start.value = localDateTimeValue(new Date(Date.now() + 60 * 60_000));
  document.querySelector("#studyRoomMessage").textContent = "";
  await loadStudyRooms();
  studyRoomDialog.showModal();
}

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function renderChatMessages(messages) {
  const container = document.querySelector("#chatMessages");
  container.replaceChildren();
  for (const message of messages) {
    const bubble = document.createElement("div");
    bubble.className = `message-bubble${(!isSupabaseConfigured && message.sender_id === "demo-me") || (currentUser && message.sender_id === currentUser.id) ? " mine" : ""}`;
    bubble.dataset.messageId = message.id;
    if (message.message_type === "image" && message.attachment_path) {
      if (message.content && message.content !== "📷 Imagen") {
        bubble.append(document.createTextNode(message.content));
      }
      const image = document.createElement("img");
      image.className = "chat-message-image";
      image.alt = "Imagen enviada por chat";
      image.loading = "lazy";
      bubble.append(image);
      void loadChatImage(image, message.attachment_path);
    } else {
      bubble.append(document.createTextNode(message.content));
    }
    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatMessageTime(message.created_at);
    bubble.append(time);
    container.append(bubble);
  }
  container.scrollTop = container.scrollHeight;
}

async function loadChatImage(image, path) {
  try {
    const { data, error } = await supabase.storage.from("chat-images").createSignedUrl(path, 60 * 60);
    if (error) throw error;
    if (image.isConnected) image.src = data.signedUrl;
  } catch (error) {
    if (image.isConnected) {
      image.alt = "No se pudo cargar esta imagen";
      image.classList.add("chat-image-error");
    }
    console.error("Could not load a private chat image.", error);
  }
}

async function loadConversations(selectId = null) {
  const list = document.querySelector("#conversationList");
  const errorOutput = document.querySelector("#chatError");
  list.replaceChildren();
  errorOutput.textContent = "";
  if (!isSupabaseConfigured) {
    for (const conversation of demoConversations) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "conversation-item";
      button.dataset.conversationId = conversation.id;
      button.dataset.partnerId = conversation.partnerId;
      button.innerHTML = `<strong>${escapeHTML(conversation.name)}</strong><span>${escapeHTML(conversation.preview)}</span>`;
      button.addEventListener("click", () => openConversation(conversation.id, conversation.partnerId, conversation.name));
      list.append(button);
    }
    chatDialog.showModal();
    const target = selectId
      ? [...list.querySelectorAll("[data-conversation-id]")].find((item) => item.dataset.conversationId === selectId)
      : list.querySelector(".conversation-item");
    target?.click();
    return;
  }
  if (!requireSignedIn("Inicia sesión para enviar y recibir mensajes.")) return;
  const { data: conversations, error } = await supabase.from("conversations")
    .select("id, user_a, user_b")
    .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const partnerIds = [...new Set((conversations ?? []).map((item) => item.user_a === currentUser.id ? item.user_b : item.user_a))];
  const names = new Map();
  if (partnerIds.length) {
    const { data: people, error: peopleError } = await supabase.from("profiles").select("id, full_name").in("id", partnerIds);
    if (peopleError) throw peopleError;
    for (const person of people ?? []) names.set(person.id, person.full_name || "Usuario");
  }
  for (const conversation of conversations ?? []) {
    const partnerId = conversation.user_a === currentUser.id ? conversation.user_b : conversation.user_a;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-item";
    button.dataset.conversationId = conversation.id;
    button.dataset.partnerId = partnerId;
    button.innerHTML = `<strong>${escapeHTML(names.get(partnerId) || "Usuario")}</strong><span>Conversación de LinkedU</span>`;
    button.addEventListener("click", () => openConversation(conversation.id, partnerId, names.get(partnerId) || "Usuario"));
    list.append(button);
  }
  if (!(conversations ?? []).length) list.innerHTML = '<p class="dialog-note">Tus conversaciones aparecerán aquí.</p>';
  chatDialog.showModal();
  if (selectId) {
    const button = [...list.querySelectorAll("[data-conversation-id]")].find((item) => item.dataset.conversationId === selectId);
    button?.click();
  }
}

async function openConversationWithTeacher(teacherId, teacherName) {
  if (!isSupabaseConfigured) {
    let conversation = demoConversations.find((item) => item.name === teacherName);
    if (!conversation) {
      const id = `demo-${normalize(teacherName).replace(/[^a-z0-9]+/g, "-")}`;
      conversation = {
        id,
        partnerId: id,
        name: teacherName,
        preview: "Hola, ¿en qué puedo ayudarte?",
        messages: [{ id: `${id}-1`, sender_id: id, content: "Hola, encantado de ayudarte. Cuéntame qué te gustaría aprender.", created_at: new Date().toISOString() }],
      };
      demoConversations.push(conversation);
    }
    await loadConversations(conversation.id);
    return;
  }
  if (!supabase || !teacherId) {
    showToast("Los docentes de ejemplo no admiten chat. Configura Supabase para usar mensajes reales.");
    return;
  }
  try {
    const { data: conversationId, error } = await supabase.rpc("get_or_create_conversation", {
      p_target_user_id: teacherId,
    });
    if (error) throw error;
    await loadConversations(conversationId);
    document.querySelector("#chatPartnerName").textContent = teacherName;
  } catch (error) {
    showToast(`No se pudo abrir la conversación: ${error.message}`);
  }
}

async function openConversation(conversationId, partnerId, partnerName) {
  clearChatAttachment();
  activeConversationId = conversationId;
  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.conversationId === conversationId);
  });
  document.querySelector("#chatPlaceholder").hidden = true;
  document.querySelector("#chatActive").hidden = false;
  document.querySelector("#chatPartnerName").textContent = partnerName;
  if (!isSupabaseConfigured) {
    const conversation = demoConversations.find((item) => item.id === conversationId);
    activeMessages = conversation?.messages ?? [];
    renderChatMessages(activeMessages);
    return;
  }
  const { data: messages, error } = await supabase.from("messages")
    .select("id, sender_id, content, message_type, attachment_path, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  activeMessages = messages ?? [];
  renderChatMessages(activeMessages);
  if (activeChatChannel) await supabase.removeChannel(activeChatChannel);
  activeChatChannel = supabase.channel(`linkedu-chat-${conversationId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload) => {
      if (activeMessages.some((message) => message.id === payload.new.id)) return;
      activeMessages.push(payload.new);
      renderChatMessages(activeMessages);
    })
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        document.querySelector("#chatError").textContent = "No se pudo conectar al chat en tiempo real. Comprueba Realtime en Supabase.";
      }
    });
}

async function beginVideoSession({ bookingId = null, roomId = null, title = "Videollamada" }) {
  if (!requireSignedIn("Inicia sesión para unirte a la videollamada.")) return;
  if (liveKitRoom) await leaveVideoSession();
  const message = document.querySelector("#videoMessage");
  const stage = document.querySelector("#videoStage");
  message.textContent = "Conectando a la sala segura…";
  stage.replaceChildren();
  document.querySelector("#videoTitle").textContent = title;
  document.querySelector("#toggleMic").disabled = true;
  document.querySelector("#toggleCamera").disabled = true;
  videoDialog.showModal();

  try {
    const result = await invokeFunction("create-video-token", bookingId ? { booking_id: bookingId } : { room_id: roomId });
    const { Room, RoomEvent, Track } = await import("livekit-client");
    const room = new Room({ adaptiveStream: true, dynacast: true });
    liveKitRoom = room;
    const addTrack = (track, participant, isLocal = false) => {
      const element = track.attach();
      if (track.kind === Track.Kind.Audio) {
        element.autoplay = true;
        videoDialog.append(element);
        return;
      }
      const tile = document.createElement("div");
      tile.className = "video-tile";
      if (element instanceof HTMLVideoElement) element.playsInline = true;
      tile.append(element);
      const name = document.createElement("span");
      name.className = "video-tile-name";
      name.textContent = `${participant.name || participant.identity}${isLocal ? " (tú)" : ""}`;
      tile.append(name);
      stage.append(tile);
    };
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => addTrack(track, participant));
    room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((element) => {
      element.closest(".video-tile")?.remove();
      if (element.parentElement === videoDialog) element.remove();
    }));
    room.on(RoomEvent.ParticipantConnected, () => {
      message.textContent = `Conectada a la sala · ${room.remoteParticipants.size + 1} participante(s).`;
    });
    room.on(RoomEvent.Disconnected, () => {
      if (liveKitRoom === room) message.textContent = "La conexión de vídeo se ha cerrado.";
    });
    await room.connect(result.server_url, result.token);
    await room.localParticipant.setCameraEnabled(true);
    await room.localParticipant.setMicrophoneEnabled(true);
    for (const publication of room.localParticipant.trackPublications.values()) {
      if (publication.track) addTrack(publication.track, room.localParticipant, true);
    }
    message.textContent = `Conectada a la sala · ${room.remoteParticipants.size + 1} participante(s).`;
    document.querySelector("#toggleMic").disabled = false;
    document.querySelector("#toggleCamera").disabled = false;
  } catch (error) {
    message.textContent = `No se pudo iniciar el vídeo: ${error.message}`;
  }
}

async function leaveVideoSession() {
  if (liveKitRoom) {
    await liveKitRoom.disconnect();
    liveKitRoom = null;
  }
  document.querySelector("#videoStage").replaceChildren();
  document.querySelector("#toggleMic").disabled = true;
  document.querySelector("#toggleCamera").disabled = true;
  if (videoDialog.open) videoDialog.close();
}

function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === "signup";
  document.querySelector("#loginTab").classList.toggle("active", !signingUp);
  document.querySelector("#signupTab").classList.toggle("active", signingUp);
  document.querySelector("#loginTab").setAttribute("aria-selected", String(!signingUp));
  document.querySelector("#signupTab").setAttribute("aria-selected", String(signingUp));
  document.querySelector("#authName").hidden = !signingUp;
  document.querySelector("#authNameLabel").hidden = !signingUp;
  document.querySelector("#authName").required = signingUp;
  document.querySelector("#authPassword").autocomplete = signingUp ? "new-password" : "current-password";
  document.querySelector("#authTitle").textContent = signingUp ? "Crea tu cuenta" : "Bienvenida a LinkedU";
  document.querySelector("#authDescription").textContent = signingUp
    ? "Únete para conectar con docentes y personas que comparten tus intereses."
    : "Entra en tu cuenta para gestionar tu perfil y descubrir docentes.";
  document.querySelector("#authSubmit").innerHTML = signingUp
    ? 'Crear cuenta <span aria-hidden="true">→</span>'
    : 'Iniciar sesión <span aria-hidden="true">→</span>';
  authMessage.textContent = "";
}

function updateAccountUI() {
  const name = currentProfile?.full_name || currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
  const accountName = currentUser ? name : "Invitada";
  const roleNames = { docente: "Docente", alumno: "Estudiante", centro: "Centro educativo" };
  document.querySelector("#sidebarName").textContent = accountName;
  document.querySelector("#sidebarRole").textContent = currentUser
    ? roleNames[currentProfile?.role] ?? "Estudiante"
    : "Estudiante";
  const accountAvatar = document.querySelector(".profile-link .avatar");
  const avatarURL = safeAvatarURL(currentProfile?.avatar_url);
  accountAvatar.innerHTML = avatarURL
    ? `<img src="${escapeHTML(avatarURL)}" alt="" />`
    : escapeHTML(initials);
  document.querySelector("#welcomeName").textContent = currentUser ? name.split(/\s+/)[0] : "aprende algo nuevo";
  document.querySelector("#authButton").textContent = currentUser ? "Salir" : "Entrar";
  document.querySelector("#profileButton").setAttribute("aria-label", currentUser ? "Editar mi perfil" : "Iniciar sesión o crear cuenta");
  document.querySelector("#payoutSetupButton").hidden = !currentUser || currentProfile?.role !== "docente";
  const promotionPanel = document.querySelector("#promotionPanel");
  const promotionButton = document.querySelector("#promoteButton");
  const promotionStatus = document.querySelector("#promotionStatus");
  const isTeacher = currentUser && currentProfile?.role === "docente";
  promotionPanel.hidden = !isTeacher;
  promotionButton.disabled = !currentProfile?.is_public || !currentProfile?.subject;
  if (!isTeacher) return;

  const startsAt = currentProfile.promoted_from ? Date.parse(currentProfile.promoted_from) : null;
  const endsAt = currentProfile.promoted_until ? Date.parse(currentProfile.promoted_until) : null;
  if (startsAt && endsAt && endsAt > Date.now()) {
    const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });
    if (startsAt > Date.now()) {
      promotionStatus.textContent = `Tu próxima promoción comenzará el ${date.format(startsAt)}.`;
      promotionButton.textContent = "⭐ Añadir otros 15 días hábiles · 24,99 €";
    } else {
      promotionStatus.textContent = `Perfil destacado hasta el ${date.format(endsAt)}.`;
      promotionButton.textContent = "⭐ Ampliar promoción 15 días hábiles · 24,99 €";
    }
  } else {
    promotionStatus.textContent = "Aún no tienes una promoción activa.";
    promotionButton.textContent = "⭐ Promocionar durante 15 días hábiles · 24,99 €";
  }
  promotionButton.title = promotionButton.disabled
    ? "Publica tu perfil y añade una materia antes de promocionarlo."
    : "";
}

async function loadOwnProfile() {
  if (!currentUser || !supabase) {
    currentProfile = null;
    updateAccountUI();
    return;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
  if (error) throw error;
  currentProfile = data;
  updateAccountUI();
}

function openAuthDialog(mode = "login") {
  setAuthMode(mode);
  authForm.reset();
  authDialog.showModal();
}

function openProfileDialog() {
  if (!currentUser) {
    openAuthDialog("signup");
    return;
  }

  profileMessage.textContent = "";
  profileForm.elements.full_name.value = currentProfile?.full_name || currentUser.user_metadata?.full_name || "";
  profileForm.elements.role.value = currentProfile?.role || "alumno";
  profileForm.elements.headline.value = currentProfile?.headline || "";
  profileForm.elements.subject.value = currentProfile?.subject || "";
  profileForm.elements.bio_short.value = currentProfile?.bio_short || "";
  profileForm.elements.languages.value = (currentProfile?.languages || []).join(", ");
  profileForm.elements.city.value = currentProfile?.city || "";
  profileForm.elements.hourly_rate.value = currentProfile?.hourly_rate ?? "";
  const availabilityDays = currentProfile?.availability_days ?? [1, 2, 3, 4, 5];
  document.querySelectorAll('input[name="availability_days"]').forEach((input) => {
    input.checked = availabilityDays.includes(Number(input.value));
  });
  profileForm.elements.availability_start.value = currentProfile?.availability_start?.slice(0, 5) || "09:00";
  profileForm.elements.availability_end.value = currentProfile?.availability_end?.slice(0, 5) || "20:00";
  profileForm.elements.avatar_url.value = currentProfile?.avatar_url || "";
  profileForm.elements.avatar_file.value = "";
  showProfileAvatarPreview(safeAvatarURL(currentProfile?.avatar_url));
  profileForm.elements.is_public.checked = currentProfile?.is_public ?? true;
  updateAccountUI();
  profileDialog.showModal();
}

function formatAuthError(error) {
  const message = error?.message ?? "";
  if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
  if (/user already registered/i.test(message)) return "Ya existe una cuenta con ese correo. Prueba a iniciar sesión.";
  if (/password should be at least/i.test(message)) return "La contraseña debe tener al menos 8 caracteres.";
  return `No se pudo completar la operación: ${message || "error desconocido"}`;
}

for (const button of categoryButtons) {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.filter;
    filterTutors();
  });
}

searchInput.addEventListener("input", filterTutors);
languageFilter.addEventListener("change", filterTutors);
document.querySelector("#sortTeachers").addEventListener("change", filterTutors);
document.querySelector("#maxPrice").addEventListener("change", filterTutors);
document.querySelector("#teacherModality").addEventListener("change", filterTutors);
document.querySelector("#clearFilters").addEventListener("click", () => {
  searchInput.value = "";
  languageFilter.value = "Todos";
  document.querySelector("#sortTeachers").value = "destacado";
  document.querySelector("#maxPrice").value = "0";
  document.querySelector("#teacherModality").value = "Todas";
  activeCategory = "Todas";
  categoryButtons.forEach((item) => item.classList.toggle("active", item.dataset.filter === "Todas"));
  filterTutors();
  document.querySelector("#clearFilters").animate([
    { transform: "scale(.96)", opacity: .7 },
    { transform: "scale(1)", opacity: 1 },
  ], { duration: 240, easing: "cubic-bezier(.25,.8,.25,1)" });
});

document.querySelector(".search-box").addEventListener("click", (event) => {
  if (window.matchMedia("(max-width: 650px)").matches && !event.currentTarget.classList.contains("mobile-open")) {
    event.preventDefault();
    event.currentTarget.classList.add("mobile-open");
    searchInput.focus();
  }
});

tutorGrid.addEventListener("click", (event) => {
  const demoContact = event.target.closest(".demo-contact");
  if (demoContact) {
    openConversationWithTeacher(null, demoContact.dataset.teacher);
    return;
  }
  const button = event.target.closest("[data-action], .book-button");
  if (!button) {
    const card = event.target.closest(".mock-card");
    if (card) openMockTeacherProfile(card.dataset.mockId);
    return;
  }
  if (button.dataset.action === "profile") {
    openMockTeacherProfile(button.dataset.teacherId);
    return;
  }
  if (button.dataset.action === "quick-book") {
    openMockBooking(button.dataset.teacherId);
    return;
  }
  if (!button.dataset.action) {
    showToast("Los perfiles de ejemplo no admiten reservas. Conecta Supabase y publica docentes reales.");
    return;
  }
  if (button.dataset.action === "contact") {
    if (!requireSignedIn("Crea una cuenta para escribir a docentes.")) return;
    openConversationWithTeacher(button.dataset.teacherId, button.dataset.teacher);
    return;
  }
  const profile = profiles.find((item) => item.id === button.dataset.teacherId);
  openBooking(button.dataset.teacherId, button.dataset.teacher, Number(profile?.hourly_rate));
});

document.querySelector("#bookingForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const startValue = event.currentTarget.elements.starts_at.value;
  const startAt = new Date(startValue);
  const message = document.querySelector("#bookingMessage");
  const button = event.currentTarget.querySelector('button[type="submit"]');
  message.textContent = "";
  if (!Number.isFinite(startAt.getTime()) || startAt.getTime() < Date.now() + 15 * 60_000) {
    message.textContent = "Elige un horario que empiece al menos dentro de 15 minutos.";
    return;
  }
  button.disabled = true;
  try {
    await startCheckout("create-booking-checkout", {
      teacher_id: selectedTeacherId,
      starts_at: startAt.toISOString(),
    });
  } catch (error) {
    message.textContent = `No se pudo iniciar el pago: ${error.message}`;
    button.disabled = false;
  }
});

document.querySelectorAll(".favorite-button").forEach((button) => {
  button.addEventListener("click", () => {
    const saved = button.classList.toggle("saved");
    button.textContent = saved ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(saved));
  });
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    document.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active");
      item.removeAttribute("aria-current");
    });
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
    document.querySelector("#sidebar").classList.remove("open");
    document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
    if (link.id === "classesNav") {
      event.preventDefault();
      if (!isSupabaseConfigured) {
        if (!currentUser) {
          openAuthDialog("login");
          showToast("Inicia sesión para ver tus reservas.");
        } else {
          const list = document.querySelector("#sessionList");
          list.innerHTML = '<article class="session-item"><div class="session-item-copy"><strong>Clases demo</strong><span>Tus próximas reservas aparecerán aquí.</span></div><span class="session-status">Vista demo</span></article>';
          document.querySelector("#sessionsDialog").showModal();
        }
      } else {
        loadMySessions().catch((error) => showToast(`No se pudieron cargar tus reservas: ${error.message}`));
      }
    } else if (link.id === "messagesNav") {
      event.preventDefault();
      loadConversations().catch((error) => showToast(`No se pudieron cargar tus mensajes: ${error.message}`));
    } else if (link.dataset.nav === "grupos") {
      event.preventDefault();
      openStudyRoomDialog().catch((error) => showToast(`No se pudieron cargar las salas: ${error.message}`));
    } else if (link.id === "favoritesNav") {
      event.preventDefault();
      favoritesOnly = true;
      filterTutors();
      document.querySelector("#docentes").scrollIntoView({ behavior:"smooth" });
    } else if (link.dataset.nav === "proyectos") {
      event.preventDefault();
      document.querySelector("#proyectos").scrollIntoView({ behavior:"smooth" });
      showToast("Sección de proyectos y grupos de estudio.");
    } else if (link.id === "settingsNav") {
      event.preventDefault();
      openProfileDialog();
    } else {
      favoritesOnly = false;
      filterTutors();
    }
  });
});

document.querySelector("#menuToggle").addEventListener("click", (event) => {
  const sidebar = document.querySelector("#sidebar");
  const expanded = sidebar.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(expanded));
});

document.querySelector("#authButton").addEventListener("click", async () => {
  if (!currentUser) {
    openAuthDialog();
    return;
  }
  if (!supabase) {
    localStorage.removeItem("linkedu_demo_user");
    currentUser = null;
    currentProfile = null;
    updateAccountUI();
    showToast("Has cerrado sesión.");
    return;
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await clearPrivateSessionState();
    currentUser = null;
    currentProfile = null;
    updateAccountUI();
    showToast("Has cerrado sesión.");
  } catch (error) {
    showToast(`No se pudo cerrar sesión: ${error.message}`);
  }
});

document.querySelector("#profileButton").addEventListener("click", openProfileDialog);
document.querySelector("#shareProfile").addEventListener("click", openProfileDialog);
document.querySelector("#loginTab").addEventListener("click", () => setAuthMode("login"));
document.querySelector("#signupTab").addEventListener("click", () => setAuthMode("signup"));
document.querySelector("#payoutSetupButton").addEventListener("click", connectTeacherPayouts);

document.querySelector("#promoteButton").addEventListener("click", async (event) => {
  if (!requireSignedIn("Inicia sesión para promocionar tu perfil.")) return;
  if (currentProfile?.role !== "docente" || !currentProfile.is_public || !currentProfile.subject) {
    profileMessage.textContent = "Guarda un perfil público de docente con una materia antes de promocionarlo.";
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  profileMessage.textContent = "";
  try {
    await startCheckout("create-teacher-promotion-checkout", {});
  } catch (error) {
    profileMessage.textContent = `No se pudo iniciar el pago de promoción: ${error.message}`;
    button.disabled = false;
  }
});
document.querySelector("#profileRole").addEventListener("change", (event) => {
  document.querySelector("#payoutSetupButton").hidden = !currentUser || event.currentTarget.value !== "docente";
});
document.querySelector("#createRoomButton").addEventListener("click", () => {
  openStudyRoomDialog().catch((error) => showToast(`No se pudieron cargar las salas: ${error.message}`));
});

document.querySelector("#studyRoomForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const form = event.currentTarget;
  const message = document.querySelector("#studyRoomMessage");
  const button = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const start = new Date(String(formData.get("starts_at")));
  message.textContent = "";
  if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now() + 15 * 60_000) {
    message.textContent = "Elige un inicio que sea al menos dentro de 15 minutos.";
    return;
  }
  button.disabled = true;
  try {
    if (!isSupabaseConfigured) {
      studyRoomDialog.close();
      showToast(`Sala creada como demo: "${String(formData.get("title")).trim()}".`);
      button.disabled = false;
      return;
    }
    const duration = Number(formData.get("duration_minutes"));
    showToast(`El total de tu plaza es ${(duration / 60 * 2).toFixed(2)} €. Abriendo Stripe…`);
    await startCheckout("create-study-room-checkout", {
      title: String(formData.get("title")).trim(),
      starts_at: start.toISOString(),
      duration_minutes: duration,
      capacity: Number(formData.get("capacity")),
    });
  } catch (error) {
    message.textContent = `No se pudo crear la sala: ${error.message}`;
    button.disabled = false;
  }
});

document.querySelector("#joinRoomButton").addEventListener("click", async () => {
  const roomId = document.querySelector("#joinRoomId").value.trim();
  const message = document.querySelector("#studyRoomMessage");
  const button = document.querySelector("#joinRoomButton");
  message.textContent = "";
  if (!isSupabaseConfigured) {
    if (!roomId) {
      message.textContent = "Introduce el código de una sala.";
      return;
    }
    studyRoomDialog.close();
    showToast("Te has unido a la sala demo.");
    return;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roomId)) {
    message.textContent = "Introduce un código de sala válido.";
    return;
  }
  button.disabled = true;
  try {
    await startCheckout("join-study-room-checkout", { room_id: roomId });
  } catch (error) {
    message.textContent = `No se pudo reservar la plaza: ${error.message}`;
    button.disabled = false;
  }
});

document.querySelector("#roomList").addEventListener("click", async (event) => {
  const button = event.target.closest(".room-join-action");
  if (!button) return;
  button.disabled = true;
  try {
    if (!isSupabaseConfigured) {
      studyRoomDialog.close();
      showToast("Te has unido a la sala de estudio.");
      button.disabled = false;
      return;
    }
    await startCheckout("join-study-room-checkout", { room_id: button.dataset.roomId });
  } catch (error) {
    button.disabled = false;
    showToast(`No se pudo reservar la plaza: ${error.message}`);
  }
});

document.querySelector("#sessionList").addEventListener("click", async (event) => {
  const classButton = event.target.closest(".join-session");
  const roomButton = event.target.closest(".join-room-video");
  const copyButton = event.target.closest(".copy-room-code");
  const cancelBookingButton = event.target.closest(".cancel-booking");
  const cancelRoomButton = event.target.closest(".cancel-room");
  if (classButton) {
    beginVideoSession({ bookingId: classButton.dataset.bookingId, title: classButton.dataset.title });
  } else if (roomButton) {
    beginVideoSession({ roomId: roomButton.dataset.roomId, title: roomButton.dataset.title });
  } else if (copyButton) {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.roomId);
      showToast("Código de sala copiado.");
    } catch (error) {
      showToast(`No se pudo copiar el código: ${error.message}`);
    }
  } else if (cancelBookingButton || cancelRoomButton) {
    const confirmed = window.confirm("Se solicitará el reembolso completo. ¿Quieres continuar?");
    if (!confirmed) return;
    const body = cancelBookingButton
      ? { booking_id: cancelBookingButton.dataset.bookingId }
      : { room_id: cancelRoomButton.dataset.roomId };
    try {
      const result = await invokeFunction("cancel-paid-session", body);
      showToast(result.status === "refunded"
        ? "Cancelación realizada y reembolso solicitado."
        : "Cancelación recibida. Stripe está procesando el reembolso.");
      await loadMySessions();
    } catch (error) {
      showToast(`No se pudo cancelar: ${error.message}`);
    }
  }
});

document.querySelector("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#chatInput");
  const content = input.value.trim();
  if ((!content && !selectedChatImage) || !activeConversationId || content.length > 3000) return;
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  document.querySelector("#chatError").textContent = "";
  if (!isSupabaseConfigured) {
    const conversation = demoConversations.find((item) => item.id === activeConversationId);
    const messageText = content || "📷 Imagen";
    conversation?.messages.push({
      id: `demo-me-${Date.now()}`,
      sender_id: "demo-me",
      content: messageText,
      created_at: new Date().toISOString(),
    });
    if (conversation) conversation.preview = messageText;
    input.value = "";
    clearChatAttachment();
    if (conversation) {
      activeMessages = conversation.messages;
      renderChatMessages(activeMessages);
      const partnerName = document.querySelector("#chatPartnerName").textContent;
      window.setTimeout(() => {
        const reply = `¡Perfecto! Podemos hablar de eso en nuestra próxima clase. He anotado: "${messageText.slice(0, 80)}"`;
        conversation.messages.push({
          id: `demo-reply-${Date.now()}`,
          sender_id: conversation.partnerId,
          content: reply,
          created_at: new Date().toISOString(),
        });
        conversation.preview = reply;
        if (activeConversationId === conversation.id) {
          activeMessages = conversation.messages;
          renderChatMessages(activeMessages);
        }
        for (const item of document.querySelectorAll(".conversation-item")) {
          if (item.dataset.conversationId === conversation.id) {
            item.querySelector("span").textContent = reply;
          }
        }
      }, 900);
    }
    button.disabled = false;
    input.focus();
    return;
  }
  let uploadedImagePath = null;
  try {
    if (selectedChatImage) {
      validateImageFile(selectedChatImage, CHAT_IMAGE_MAX_BYTES);
      const extension = IMAGE_TYPES.get(selectedChatImage.type);
      uploadedImagePath = `${activeConversationId}/${currentUser.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(uploadedImagePath, selectedChatImage, {
        cacheControl: "3600",
        contentType: selectedChatImage.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
    }
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content: content || (uploadedImagePath ? "📷 Imagen" : ""),
      message_type: uploadedImagePath ? "image" : "text",
      attachment_path: uploadedImagePath,
    });
    if (error) throw error;
    input.value = "";
    clearChatAttachment();
  } catch (error) {
    if (uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage.from("chat-images").remove([uploadedImagePath]);
      if (cleanupError) console.error("Could not remove chat image after message sending failed.", cleanupError);
    }
    document.querySelector("#chatError").textContent = `No se pudo enviar el mensaje: ${error.message}`;
  } finally {
    button.disabled = false;
    input.focus();
  }
});

document.querySelector("#profileAvatarFile").addEventListener("change", (event) => {
  const file = event.currentTarget.files[0];
  if (profilePreviewObjectUrl) URL.revokeObjectURL(profilePreviewObjectUrl);
  profilePreviewObjectUrl = null;
  if (!file) {
    showProfileAvatarPreview(safeAvatarURL(profileForm.elements.avatar_url.value));
    return;
  }
  try {
    validateImageFile(file, PROFILE_IMAGE_MAX_BYTES);
    profilePreviewObjectUrl = URL.createObjectURL(file);
    showProfileAvatarPreview(profilePreviewObjectUrl);
    profileMessage.textContent = "";
  } catch (error) {
    event.currentTarget.value = "";
    profileMessage.textContent = error.message;
  }
});

document.querySelector("#removeProfileAvatar").addEventListener("click", () => {
  profileForm.elements.avatar_file.value = "";
  profileForm.elements.avatar_url.value = "";
  if (profilePreviewObjectUrl) URL.revokeObjectURL(profilePreviewObjectUrl);
  profilePreviewObjectUrl = null;
  showProfileAvatarPreview("");
});

document.querySelector("#chatImageFile").addEventListener("change", (event) => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  try {
    validateImageFile(file, CHAT_IMAGE_MAX_BYTES);
    selectedChatImage = file;
    if (chatPreviewObjectUrl) URL.revokeObjectURL(chatPreviewObjectUrl);
    chatPreviewObjectUrl = URL.createObjectURL(file);
    document.querySelector("#chatAttachmentPreviewImage").src = chatPreviewObjectUrl;
    document.querySelector("#chatAttachmentName").textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    document.querySelector("#chatAttachmentPreview").hidden = false;
    document.querySelector("#chatError").textContent = "";
  } catch (error) {
    event.currentTarget.value = "";
    document.querySelector("#chatError").textContent = error.message;
  }
});

document.querySelector("#removeChatAttachment").addEventListener("click", clearChatAttachment);

document.querySelector("#toggleMic").addEventListener("click", async (event) => {
  if (!liveKitRoom) return;
  try {
    const enabled = !liveKitRoom.localParticipant.isMicrophoneEnabled;
    await liveKitRoom.localParticipant.setMicrophoneEnabled(enabled);
    event.currentTarget.textContent = enabled ? "🎙 Silenciar" : "🎙 Activar micro";
  } catch (error) {
    document.querySelector("#videoMessage").textContent = `No se pudo cambiar el micrófono: ${error.message}`;
  }
});

document.querySelector("#toggleCamera").addEventListener("click", async (event) => {
  if (!liveKitRoom) return;
  try {
    const enabled = !liveKitRoom.localParticipant.isCameraEnabled;
    await liveKitRoom.localParticipant.setCameraEnabled(enabled);
    event.currentTarget.textContent = enabled ? "▣ Cámara" : "▣ Activar cámara";
  } catch (error) {
    document.querySelector("#videoMessage").textContent = `No se pudo cambiar la cámara: ${error.message}`;
  }
});
document.querySelector("#leaveVideo").addEventListener("click", leaveVideoSession);
document.querySelector("#endVideo").addEventListener("click", leaveVideoSession);
window.addEventListener("beforeunload", () => {
  liveKitRoom?.disconnect();
});
videoDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  leaveVideoSession();
});

document.querySelector("#demoLoginButton").addEventListener("click", () => {
  const demoName = "Lucía Estudiante";
  currentUser = { id:"demo-user", email:"demo@linkeduu.es", user_metadata:{ full_name:demoName } };
  currentProfile = { full_name:demoName, role:"alumno", is_public:true };
  localStorage.setItem("linkedu_demo_user", JSON.stringify({ email:"demo@linkeduu.es", name:demoName }));
  updateAccountUI();
  authDialog.close();
  showToast("Sesión demo iniciada.");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  const formData = new FormData(authForm);
  const email = String(formData.get("email")).trim();
  const password = String(formData.get("password"));
  const submitButton = document.querySelector("#authSubmit");
  submitButton.disabled = true;

  try {
    if (!isSupabaseConfigured) {
      const fullName = String(formData.get("name")).trim();
      const name = authMode === "signup" ? (fullName || email.split("@")[0]) : email.split("@")[0];
      currentUser = { id:"demo-user", email, user_metadata:{ full_name:name } };
      currentProfile = { full_name:name, role:"alumno", is_public:true };
      localStorage.setItem("linkedu_demo_user", JSON.stringify({ email, name }));
      updateAccountUI();
      authDialog.close();
      showToast(authMode === "signup" ? "Cuenta demo creada. Ya puedes usar LinkedU." : "Has iniciado sesión.");
      return;
    }
    if (!supabase) throw new Error("Supabase no está configurado. Añade las claves a .env.local y reinicia el servidor.");
    if (authMode === "signup") {
      const fullName = String(formData.get("name")).trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (!data.session) {
        authMessage.textContent = "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.";
        authForm.reset();
        return;
      }
      currentUser = data.user;
      authDialog.close();
      await loadOwnProfile();
      openProfileDialog();
      showToast("¡Bienvenida a LinkedU! Completa tu perfil para empezar.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      authDialog.close();
      await loadOwnProfile();
      showToast("Has iniciado sesión.");
    }
  } catch (error) {
    authMessage.textContent = formatAuthError(error);
  } finally {
    submitButton.disabled = false;
  }
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileMessage.textContent = "";
  if (!currentUser) {
    profileMessage.textContent = "Inicia sesión para guardar tu perfil.";
    return;
  }

  const formData = new FormData(profileForm);
  const avatarURL = String(formData.get("avatar_url")).trim();
  const avatarFile = profileForm.elements.avatar_file.files[0] ?? null;
  if (!avatarFile && avatarURL && !safeAvatarURL(avatarURL)) {
    profileMessage.textContent = "El enlace de la foto debe comenzar por https://";
    return;
  }
  if (avatarFile) {
    try {
      validateImageFile(avatarFile, PROFILE_IMAGE_MAX_BYTES);
    } catch (error) {
      profileMessage.textContent = error.message;
      return;
    }
  }

  const rateValue = String(formData.get("hourly_rate")).trim();
  const availabilityDays = formData.getAll("availability_days").map(Number);
  const availabilityStart = String(formData.get("availability_start"));
  const availabilityEnd = String(formData.get("availability_end"));
  if (String(formData.get("role")) === "docente"
    && (!availabilityDays.length || availabilityStart >= availabilityEnd)) {
    profileMessage.textContent = "Selecciona al menos un día y un horario válido para tus clases.";
    return;
  }
  const profile = {
    full_name: String(formData.get("full_name")).trim(),
    role: String(formData.get("role")),
    headline: String(formData.get("headline")).trim(),
    subject: String(formData.get("subject")).trim(),
    bio_short: String(formData.get("bio_short")).trim(),
    languages: String(formData.get("languages")).split(",").map((language) => language.trim()).filter(Boolean).slice(0, 10),
    city: String(formData.get("city")).trim(),
    hourly_rate: rateValue ? Number(rateValue) : null,
    availability_days: availabilityDays.length ? availabilityDays : [1, 2, 3, 4, 5],
    availability_start: availabilityStart || "09:00",
    availability_end: availabilityEnd || "20:00",
    avatar_url: avatarURL,
    is_public: formData.get("is_public") === "on",
    updated_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured) {
    currentProfile = { ...currentProfile, ...profile };
    localStorage.setItem("linkedu_demo_profile", JSON.stringify(profile));
    updateAccountUI();
    profileDialog.close();
    showToast("Perfil guardado.");
    return;
  }
  const submitButton = profileForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  let uploadedAvatarPath = null;

  try {
    if (avatarFile) {
      const extension = IMAGE_TYPES.get(avatarFile.type);
      uploadedAvatarPath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(uploadedAvatarPath, avatarFile, {
        cacheControl: "3600",
        contentType: avatarFile.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      profile.avatar_url = supabase.storage.from("profile-avatars").getPublicUrl(uploadedAvatarPath).data.publicUrl;
    }
    const oldAvatarPath = getStoredAvatarPath(currentProfile?.avatar_url);
    const { data, error } = await supabase.from("profiles").update(profile).eq("id", currentUser.id).select("*").single();
    if (error) throw error;
    currentProfile = data;
    if (oldAvatarPath && oldAvatarPath !== uploadedAvatarPath && (avatarFile || !profile.avatar_url)) {
      const { error: removeError } = await supabase.storage.from("profile-avatars").remove([oldAvatarPath]);
      if (removeError) console.error("Could not remove the previous profile image.", removeError);
    }
    updateAccountUI();
    profileDialog.close();
    showToast("Perfil guardado.");
    try {
      await loadPublicProfiles();
    } catch (refreshError) {
      showToast(`Perfil guardado, pero no se pudo actualizar la búsqueda: ${refreshError.message}`);
    }
  } catch (error) {
    if (uploadedAvatarPath) {
      const { error: cleanupError } = await supabase.storage.from("profile-avatars").remove([uploadedAvatarPath]);
      if (cleanupError) console.error("Could not remove profile image after saving failed.", cleanupError);
    }
    profileMessage.textContent = `No se pudo guardar el perfil: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#joinClass").addEventListener("click", () => {
  document.querySelector("#classesNav").click();
});

async function clearPrivateSessionState() {
  if (activeChatChannel && supabase) {
    const channel = activeChatChannel;
    activeChatChannel = null;
    activeConversationId = null;
    activeMessages = [];
    await supabase.removeChannel(channel);
  }
  if (liveKitRoom) await leaveVideoSession();
  document.querySelector("#chatMessages").replaceChildren();
  document.querySelector("#chatActive").hidden = true;
  document.querySelector("#chatPlaceholder").hidden = false;
  if (chatDialog.open) chatDialog.close();
}

async function handleProviderRedirect() {
  const url = new URL(window.location.href);
  const payment = url.searchParams.get("payment");
  const roomPayment = url.searchParams.get("room_payment");
  const payoutSetup = url.searchParams.get("payout_setup");
  const promotion = url.searchParams.get("promotion");
  const promotionId = url.searchParams.get("promotion_id");
  const bookingId = url.searchParams.get("booking_id");
  const roomId = url.searchParams.get("room_id");

  if (payment === "success" && bookingId && currentUser) {
    let confirmed = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase.from("bookings").select("status").eq("id", bookingId).maybeSingle();
      if (error) throw error;
      if (data?.status === "confirmed") {
        confirmed = true;
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
    showToast(confirmed
      ? "¡Pago confirmado! Tu clase ya está en Mis clases."
      : "Pago recibido. Stripe está confirmando tu reserva; aparecerá en Mis clases en unos instantes.");
    await loadMySessions();
  } else if (payment === "cancelled") {
    showToast("No se ha completado el pago. No se te ha cobrado.");
  }

  if (roomPayment === "success" && roomId && currentUser) {
    let joined = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase.from("study_room_members")
        .select("status")
        .eq("room_id", roomId)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.status === "joined") {
        joined = true;
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
    showToast(joined
      ? `Plaza confirmada. Comparte este código de sala: ${roomId}`
      : `Pago recibido. Tu plaza se está confirmando. Código de sala: ${roomId}`);
    await loadMySessions();
  } else if (roomPayment === "cancelled") {
    showToast("No se ha completado el pago de la sala. No se te ha cobrado.");
  }

  if (payoutSetup === "complete") {
    showToast("Configuración iniciada. Stripe comprobará tu cuenta y te avisará cuando puedas aceptar pagos.");
  } else if (payoutSetup === "refresh") {
    showToast("Continúa la verificación de Stripe para activar los cobros.");
  }

  if (promotion === "success" && promotionId && currentUser) {
    let active = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase.from("teacher_promotions")
        .select("status")
        .eq("id", promotionId)
        .eq("teacher_id", currentUser.id)
        .maybeSingle();
      if (error) throw error;
      if (data?.status === "active") {
        active = true;
        break;
      }
      if (data && data.status !== "pending_payment") break;
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    await loadOwnProfile();
    await loadPublicProfiles();
    showToast(active
      ? "¡Pago confirmado! Tu perfil ya está promocionado durante 15 días hábiles."
      : "Pago recibido. La promoción aparecerá en cuanto Stripe confirme el pago.");
  } else if (promotion === "cancelled") {
    showToast("No se ha completado el pago de la promoción. No se te ha cobrado.");
  }

  if (payment || roomPayment || payoutSetup || promotion) {
    url.searchParams.delete("payment");
    url.searchParams.delete("room_payment");
    url.searchParams.delete("payout_setup");
    url.searchParams.delete("booking_id");
    url.searchParams.delete("room_id");
    url.searchParams.delete("promotion");
    url.searchParams.delete("promotion_id");
    window.history.replaceState({}, "", url);
  }
}

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector(".search-box").classList.add("mobile-open");
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    document.querySelector(".search-box").classList.remove("mobile-open");
    searchInput.blur();
  }
});

async function initializeApp() {
  updateDates();
  updateAccountUI();
  window.setInterval(updateDates, 60_000);

  if (!isSupabaseConfigured) {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem("linkedu_demo_favorites") || "[]");
      if (Array.isArray(savedFavorites)) favoriteTeacherIds = new Set(savedFavorites);
      const savedUser = JSON.parse(localStorage.getItem("linkedu_demo_user") || "null");
      if (savedUser?.name) {
        currentUser = { id:"demo-user", email:savedUser.email || "demo@linkeduu.es", user_metadata:{ full_name:savedUser.name } };
        currentProfile = { full_name:savedUser.name, role:"alumno", is_public:true };
      }
      const savedProfile = JSON.parse(localStorage.getItem("linkedu_demo_profile") || "null");
      if (savedProfile && currentUser) currentProfile = { ...currentProfile, ...savedProfile };
    } catch {
      localStorage.removeItem("linkedu_demo_user");
    }
    updateAccountUI();
    renderMockTeachers();
    showToast("Modo vista previa: configura Supabase para habilitar cuentas, perfiles y búsqueda real.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user ?? null;
    await loadOwnProfile();
    await loadPublicProfiles();
    await handleProviderRedirect();
  } catch (error) {
    showToast(`No se pudo conectar con Supabase: ${error.message}`);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user ?? null;
    if (nextUser?.id !== currentUser?.id) {
      if (activeChatChannel) {
        const channel = activeChatChannel;
        activeChatChannel = null;
        void supabase.removeChannel(channel).catch((error) => showToast(`No se pudo cerrar el chat anterior: ${error.message}`));
      }
      if (liveKitRoom) {
        void leaveVideoSession().catch((error) => showToast(`No se pudo cerrar la videollamada: ${error.message}`));
      }
      activeConversationId = null;
      activeMessages = [];
      document.querySelector("#chatMessages").replaceChildren();
      document.querySelector("#chatActive").hidden = true;
      document.querySelector("#chatPlaceholder").hidden = false;
      if (chatDialog.open) chatDialog.close();
    }
    currentUser = nextUser;
    window.setTimeout(async () => {
      try {
        await loadOwnProfile();
      } catch (error) {
        showToast(`No se pudo cargar tu perfil: ${error.message}`);
      }
    }, 0);
  });
}

initializeApp();
