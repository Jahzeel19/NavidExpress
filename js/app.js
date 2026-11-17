/* ==========================================================================
   EXPRESO DE NAVIDAD · Lógica principal
   1. Utilidades y datos          5. Mapa y viaje del tren
   2. Guardado (localStorage)     6. Estaciones y actividades
   3. Interfaz general            7. Certificado
   4. Pasajero, boleto y abordaje 8. Controles de sonido e inicio
   ========================================================================== */
"use strict";

/* 1. Utilidades y datos ================================================== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const YEAR = new Date().getFullYear();

const STATIONS = [
  {
    id: "village", short: "Villa Nevada", title: "Villa Nevada", art: "🏘️", starName: "Estrella de la Luz", wagon: "VILLA", color: "#2c4a6b",
    eyebrow: "UN PUEBLO LLENO DE LUZ",
    description: "Las chimeneas humean y la nieve cubre los tejados, pero el pueblo se quedó a oscuras. Encuentra las tres farolas escondidas y enciéndelas para devolverle la luz."
  },
  {
    id: "workshop", short: "Taller de Santa", title: "Taller de Santa", art: "🎁", starName: "Estrella del Taller", wagon: "TALLER", color: "#8f332f",
    eyebrow: "LA FÁBRICA DE LOS REGALOS",
    description: "Los duendes van atrasados con los encargos. Lee cada pista y elige el papel de regalo correcto para envolver los tres paquetes."
  },
  {
    id: "letter", short: "Vagón de los deseos", title: "Vagón de los deseos", art: "✉️", starName: "Estrella del Deseo", wagon: "DESEOS", color: "#5b4a86",
    eyebrow: "UN MENSAJE DESDE EL CORAZÓN",
    description: "En este vagón el tiempo parece detenerse. Escribe un deseo, una carta a Santa o un agradecimiento. Tus mensajes quedan guardados para que vuelvas a leerlos cuando quieras."
  },
  {
    id: "tree", short: "El Gran Pino", title: "El Gran Pino", art: "🎄", starName: "Estrella del Árbol", wagon: "ÁRBOL", color: "#2d6e5c",
    eyebrow: "LA PLAZA DEL ÁRBOL",
    description: "En la plaza del pueblo espera un pino enorme, pero todavía no tiene adornos. Elige esferas, bastones, campanas y moños, colócalos en sus ramas y corónalo con la estrella para encenderlo."
  },
  {
    id: "north", short: "Polo Norte", title: "Polo Norte", art: "🎅", starName: "Estrella Polar", wagon: "POLO", color: "#9c7430",
    eyebrow: "¡HAS LLEGADO A TU DESTINO!",
    description: "Las luces del norte iluminan el cielo y el pueblo de Santa te recibe. Aquí puedes revisar tu viaje y recoger tu certificado de viajero."
  }
];

// Regalos posibles del Taller de Santa (se eligen 3 con colores distintos)
const GIFTS = [
  { id: "osito", icon: "🧸", to: "Mateo", clue: "Quiere su osito envuelto del color de la nariz de Rodolfo.", color: "rojo" },
  { id: "cohete", icon: "🚀", to: "Lucía", clue: "Pidió un papel del color del cielo a medianoche.", color: "azul" },
  { id: "libro", icon: "📚", to: "el abuelo", clue: "Le encanta el color de los pinos del bosque.", color: "verde" },
  { id: "tren", icon: "🚂", to: "Sofía", clue: "Desea el color de la estrella que corona el árbol.", color: "dorado" },
  { id: "pelota", icon: "⚽", to: "Diego", clue: "Quiere el color del trineo de Santa.", color: "rojo" },
  { id: "campana", icon: "🔔", to: "Valentina", clue: "Sueña con un papel que brille como las campanas.", color: "dorado" },
  { id: "patines", icon: "⛸️", to: "Andrés", clue: "Prefiere el color del lago congelado.", color: "azul" },
  { id: "bufanda", icon: "🧣", to: "la abuela", clue: "Pidió el color del muérdago y de las coronas navideñas.", color: "verde" }
];
const TOTAL = STATIONS.length;
const pad = (n) => String(n).padStart(2, "0");
const WRAP_COLORS = ["rojo", "azul", "verde", "dorado"];

const WISH_TYPES = {
  deseo: { label: "Deseo", placeholder: "Esta Navidad deseo…" },
  carta: { label: "Carta a Santa", placeholder: "Querido Santa…" },
  gracias: { label: "Agradecimiento", placeholder: "Este año quiero agradecer…" }
};

// El Gran Pino: adornos disponibles y ramas donde colocarlos (coordenadas del SVG 300 × 340)
const ORNAMENTS = {
  roja: { label: "Esfera roja" },
  dorada: { label: "Esfera dorada" },
  azul: { label: "Esfera azul" },
  baston: { label: "Bastón de caramelo" },
  campana: { label: "Campana" },
  mono: { label: "Moño" },
  estrella: { label: "Estrella" }
};
const TREE_SPOTS = [
  [150, 36],                                  // 0: punta (solo la estrella)
  [137, 100], [166, 112],                     // ramas de arriba
  [118, 160], [152, 150], [186, 163],         // ramas del centro
  [100, 224], [136, 212], [172, 227], [200, 210] // ramas de abajo
];
const TREE_GOAL = 6; // adornos necesarios (además de la estrella)

/* 2. Guardado (localStorage) ============================================= */
const STORAGE_KEY = "expresoNavidad";
const PREFS_KEY = "expresoNavidad.prefs";

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function blankState() {
  return {
    version: 3, name: "", code: "", createdAt: null, boarded: false, location: -1,
    visited: [], stars: { village: false, workshop: false, letter: false, tree: false, north: false },
    lanterns: [], orders: null, gifts: [], letters: [],
    tree: { ornaments: {}, topper: false, lit: false },
    wagons: [] // estaciones completadas, en el orden en que se engancharon los vagones
  };
}

// Normaliza los datos guardados (incluida la versión de la Etapa 3)
function migrate(raw) {
  if (!raw || typeof raw !== "object") return null;
  const s = blankState();
  const list = (v) => (Array.isArray(v) ? v : []);
  const unique = (arr) => [...new Set(arr)];

  const legacyGuest = raw.name === "Pasajero" && !raw.code;
  s.name = typeof raw.name === "string" && !legacyGuest ? raw.name.slice(0, 28) : "";
  s.code = typeof raw.code === "string" ? raw.code : "";
  s.createdAt = raw.createdAt || null;
  s.boarded = Boolean(raw.boarded || (!raw.version && s.name));
  // Antes de la versión 3 el Polo Norte era la estación 3; ahora es la 4 (se agregó El Gran Pino)
  const remap = (i) => ((raw.version || 0) < 3 && i === 3 ? 4 : i);
  const loc = remap(raw.location);
  s.location = Number.isInteger(loc) && loc >= -1 && loc < TOTAL ? loc : -1;
  s.visited = unique(list(raw.visited).map(remap).filter((i) => Number.isInteger(i) && i >= 0 && i < TOTAL));
  if (raw.tree && typeof raw.tree === "object") {
    const orn = raw.tree.ornaments && typeof raw.tree.ornaments === "object" ? raw.tree.ornaments : {};
    Object.entries(orn).forEach(([k, v]) => {
      if (Number(k) >= 1 && Number(k) < TREE_SPOTS.length && ORNAMENTS[v] && v !== "estrella") s.tree.ornaments[k] = v;
    });
    s.tree.topper = Boolean(raw.tree.topper);
    s.tree.lit = Boolean(raw.tree.lit);
  }
  s.lanterns = unique(list(raw.lanterns).filter((i) => [0, 1, 2].includes(i)));

  if (raw.stars && typeof raw.stars === "object") {
    Object.keys(s.stars).forEach((k) => { s.stars[k] = Boolean(raw.stars[k]); });
  } else {
    s.stars.village = Boolean(raw.villageStar);
    s.stars.workshop = Boolean(raw.workshopStar);
    s.stars.letter = Boolean(raw.letterStar);
  }

  const gifts = list(raw.gifts);
  if (gifts.length && typeof gifts[0] === "number") {
    // Etapa 3: los regalos eran índices de osito/cohete/libro
    const legacy = ["osito", "cohete", "libro"];
    s.orders = legacy;
    s.gifts = unique(gifts).filter((i) => i >= 0 && i < 3).map((i) => ({ id: legacy[i], color: GIFTS.find((g) => g.id === legacy[i]).color }));
  } else {
    s.gifts = gifts.filter((g) => g && typeof g.id === "string");
    const orders = list(raw.orders).filter((id) => GIFTS.some((g) => g.id === id));
    s.orders = orders.length === 3 ? orders : null;
  }
  if (s.orders) s.gifts = s.gifts.slice(0, 3);

  s.letters = list(raw.letters).map((l) =>
    typeof l === "string" ? { text: l, type: "deseo", date: null } : l
  ).filter((l) => l && typeof l.text === "string" && l.text.trim());

  // Vagones: se respeta el orden guardado y se agregan los que falten
  const ids = STATIONS.map((st) => st.id);
  s.wagons = unique(list(raw.wagons).filter((id) => ids.includes(id) && s.stars[id]));
  ids.forEach((id) => { if (s.stars[id] && !s.wagons.includes(id)) s.wagons.push(id); });

  return s;
}

let state = migrate(readStorage(STORAGE_KEY)) || blankState();
const prefs = Object.assign({ sfx: true }, readStorage(PREFS_KEY) || {});

function save() {
  if (!writeStorage(STORAGE_KEY, state)) setHint("⚠ No se pudo guardar el progreso en este navegador (¿modo privado?).");
}

const isRegistered = () => Boolean(state.name);
const starCount = () => Object.values(state.stars).filter(Boolean).length;
const isComplete = (index) => state.stars[STATIONS[index].id];

let newWagon = null; // último vagón enganchado (para animarlo)

function addWagon(id) {
  if (!state.wagons.includes(id)) state.wagons.push(id);
  newWagon = id;
  renderHeroWagons();
  renderMapWagons();
}

function awardStar(id) {
  if (state.stars[id]) return false;
  state.stars[id] = true;
  addWagon(id);
  save();
  Sound.star();
  const hud = $("#hud");
  hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump");
  updateUI();
  return true;
}

/* 3. Interfaz general ==================================================== */
function setHint(text) { $("#mapHint").textContent = text; }

function updateUI() {
  const stars = starCount();
  $("#hudStars").textContent = stars;
  $("#hudLabel").textContent = `de ${TOTAL} estrellas conseguidas`;
  $("#hud").setAttribute("aria-label", `Progreso: ${stars} de ${TOTAL} estrellas`);

  // Portada
  if (isRegistered()) {
    $("#boardLabel").textContent = state.boarded ? "CONTINUAR EL VIAJE" : "ABORDAR EL TREN";
    $("#heroIntro").innerHTML = state.boarded
      ? `¡Qué gusto verte a bordo, <strong>${escapeHTML(state.name)}</strong>! El tren te espera en el mapa para seguir recorriendo las estaciones rumbo al Polo Norte.`
      : `Tu boleto está listo, <strong>${escapeHTML(state.name)}</strong>. Sube al Expreso de Navidad y descubre un mundo de luces, nieve y pequeñas sorpresas.`;
    $("#heroNote").innerHTML = `<span aria-hidden="true">✧</span> Boleto ${escapeHTML(state.code)} · ${stars} de ${TOTAL} estrellas`;
  } else {
    $("#boardLabel").textContent = "ABORDAR EL TREN";
  }

  // Mapa
  $$(".map-stop").forEach((btn) => {
    const i = Number(btn.dataset.station);
    const complete = isComplete(i);
    const visited = state.visited.includes(i);
    btn.classList.toggle("complete", complete);
    btn.classList.toggle("visited", visited);
    btn.classList.toggle("current", state.boarded && state.location === i);
    $(".stop-state", btn).textContent = complete ? `★ ${STATIONS[i].starName}` : visited ? "✓ Visitada" : "";
  });
  $$(".map-dot").forEach((dot, i) => dot.classList.toggle("done", isComplete(i)));

  // Bitácora
  $("#logbookTitle").textContent = isRegistered() ? `Bitácora de ${state.name}` : "Tu progreso";
  $("#logbookStations").innerHTML = STATIONS.map((st, i) => {
    const cls = isComplete(i) ? "complete" : state.visited.includes(i) ? "visited" : "";
    const icon = isComplete(i) ? "★" : state.visited.includes(i) ? "✓" : "○";
    const status = isComplete(i) ? "completada" : state.visited.includes(i) ? "visitada" : "pendiente";
    return `<li class="${cls}"><span aria-hidden="true">${icon}</span> ${st.short}<span class="sr-only">: ${status}</span></li>`;
  }).join("");
  $("#logbookStars").innerHTML = `<span class="sr-only">${stars} de ${TOTAL} estrellas</span>` +
    STATIONS.map((st) => `<span aria-hidden="true" class="${state.stars[st.id] ? "on" : ""}" title="${st.starName}">★</span>`).join("");
}

/* 4. Pasajero, boleto y abordaje ========================================= */
let pendingStation = null;
const passengerDialog = $("#passengerDialog");
const ticketDialog = $("#ticketDialog");
const stationDialog = $("#stationDialog");

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `EXP-${YEAR}-${out}`;
}

function openPassengerDialog(message = "") {
  $("#passengerName").value = state.name || "";
  $("#nameError").textContent = message;
  $("#passengerName").removeAttribute("aria-invalid");
  passengerDialog.showModal();
}

function updateTicket() {
  $("#ticketName").textContent = state.name || "Pasajero";
  $("#ticketCode").textContent = state.code || "EXP-0000";
  $("#ticketDate").textContent = `25 DIC ${YEAR}`;
  const punch = $("#ticketPunch");
  punch.classList.remove("show");
  punch.classList.toggle("static", state.boarded);
  $("#boardTrain").textContent = state.boarded ? "CONTINUAR EL VIAJE →" : "¡ABORDAR EL TREN! →";
  resetConfirm();
}

function showTicket() {
  if (!isRegistered()) return openPassengerDialog();
  updateTicket();
  ticketDialog.showModal();
}

$("#passengerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#passengerName");
  const name = input.value.replace(/\s+/g, " ").trim();
  if (!name) {
    $("#nameError").textContent = "Escribe tu nombre para generar el boleto.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    Sound.wrong();
    return;
  }
  state.name = name.slice(0, 28);
  if (!state.code) { state.code = generateCode(); state.createdAt = new Date().toISOString(); }
  save();
  Sound.paper();
  passengerDialog.close();
  updateUI();
  showTicket();
});
$("#closePassenger").addEventListener("click", () => passengerDialog.close());
passengerDialog.addEventListener("close", () => { if (!isRegistered()) pendingStation = null; });

$("#ticketButton").addEventListener("click", () => { Sound.click(); showTicket(); });
$("#closeTicket").addEventListener("click", () => ticketDialog.close());
$("#editPassenger").addEventListener("click", () => { ticketDialog.close(); openPassengerDialog(); });
$("#boardButton").addEventListener("click", () => {
  Sound.click();
  if (!isRegistered()) openPassengerDialog();
  else if (!state.boarded) showTicket();
  else goToMap();
});

$("#boardTrain").addEventListener("click", async () => {
  const button = $("#boardTrain");
  if (!state.boarded) {
    button.disabled = true;
    const punch = $("#ticketPunch");
    punch.classList.add("show");
    Sound.stamp();
    await wait(700);
    state.boarded = true;
    save();
    button.disabled = false;
    ticketDialog.close();
    updateUI();
    await departure();
  } else {
    ticketDialog.close();
    await goToMap();
  }
  if (pendingStation !== null) {
    const next = pendingStation;
    pendingStation = null;
    travelTo(next);
  }
});

// Animación de partida en la portada y desplazamiento hasta el mapa
async function departure() {
  const train = $("#heroTrain");
  Sound.whistle(1.1);
  setHint("¡Todos a bordo! El Expreso de Navidad sale de la estación…");
  if (!prefersReducedMotion()) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    train.classList.remove("departing"); void train.getBoundingClientRect();
    train.classList.add("departing");
    setTimeout(() => Sound.chug(1.6), 250);
    await wait(1500);
    setTimeout(() => train.classList.remove("departing"), 2000);
  }
  await goToMap();
  setHint("✧ Elige una estación: el tren te llevará hasta ella.");
}

async function goToMap() {
  $("#recorrido").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  await wait(prefersReducedMotion() ? 50 : 750);
}

// Reiniciar el viaje (confirmación en dos pasos, sin ventanas emergentes del navegador)
let confirmTimer = null;
function resetConfirm() {
  const btn = $("#resetJourney");
  btn.classList.remove("confirming");
  btn.textContent = "REINICIAR VIAJE";
  clearTimeout(confirmTimer);
}
$("#resetJourney").addEventListener("click", () => {
  const btn = $("#resetJourney");
  if (!btn.classList.contains("confirming")) {
    btn.classList.add("confirming");
    btn.textContent = "¿SEGURO? TOCA DE NUEVO";
    confirmTimer = setTimeout(resetConfirm, 4000);
    return;
  }
  resetConfirm();
  state = blankState();
  save();
  newWagon = null;
  renderHeroWagons();
  renderMapWagons();
  ticketDialog.close();
  placeTrainAt(0);
  updateUI();
  $("#heroIntro").textContent = "Sube a bordo del Expreso de Navidad y descubre un mundo de luces, nieve y pequeñas sorpresas en el camino hacia el Polo Norte.";
  $("#heroNote").innerHTML = `<span aria-hidden="true">✧</span> El espíritu de la Navidad te espera.`;
  setHint("Tu viaje se reinició. ¡Prepara un nuevo boleto!");
  openPassengerDialog();
});

/* 5. Mapa y viaje del tren =============================================== */
const routePath = $("#routePath");
const mapFrame = $("#mapFrame");
const mapTrain = $("#mapTrain");
const VIEW_W = 1000, VIEW_H = 480;
const STATION_ANCHORS = [[95, 365], [285, 175], [480, 320], [680, 210], [880, 95]];
let routeLength = 0;
let stationLengths = [];
let trainLength = 0;
let traveling = false;
let trainDirection = 1;

function nearestLength(x, y) {
  let best = 0, bestDist = Infinity;
  for (let l = 0; l <= routeLength; l += 2) {
    const p = routePath.getPointAtLength(l);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bestDist) { bestDist = d; best = l; }
  }
  return best;
}

function setupMap() {
  routeLength = routePath.getTotalLength();
  stationLengths = STATION_ANCHORS.map(([x, y]) => nearestLength(x, y));
  const dots = $("#mapDots");
  dots.innerHTML = "";
  stationLengths.forEach((len) => {
    const p = routePath.getPointAtLength(len);
    const dot = document.createElement("span");
    dot.className = "map-dot";
    dot.style.left = `${(p.x / VIEW_W) * 100}%`;
    dot.style.top = `${(p.y / VIEW_H) * 100}%`;
    dots.appendChild(dot);
  });
  const start = routePath.getPointAtLength(0);
  Object.assign($("#mapStart").style, { left: `${(start.x / VIEW_W) * 100 + 3}%`, top: `${(start.y / VIEW_H) * 100}%` });
  const startAt = state.boarded && state.location >= 0 ? stationLengths[state.location] : 0;
  placeTrainAt(startAt);
}

// Coloca el tren en un punto de la ruta, orientado según la dirección de avance
function placeTrainAt(length, direction = 1) {
  trainLength = length;
  const p = routePath.getPointAtLength(length);
  const a = routePath.getPointAtLength(Math.max(0, length - 3));
  const b = routePath.getPointAtLength(Math.min(routeLength, length + 3));
  const rect = mapFrame.getBoundingClientRect();
  const sx = rect.width / VIEW_W, sy = rect.height / VIEW_H;
  const vx = (b.x - a.x) * sx * direction;
  const vy = (b.y - a.y) * sy * direction;
  const flip = vx < 0;
  let angle = flip ? Math.atan2(-vy, -vx) : Math.atan2(vy, vx);
  angle = Math.max(-40, Math.min(40, (angle * 180) / Math.PI));
  mapTrain.classList.toggle("flip", flip);
  mapTrain.style.left = `${(p.x / VIEW_W) * 100}%`;
  mapTrain.style.top = `${(p.y / VIEW_H) * 100}%`;
  mapTrain.style.transform = `translate(-50%, -78%) rotate(${angle}deg)`;
  trainDirection = direction;
  positionMapWagons();
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function animateTrain(from, to) {
  return new Promise((resolve) => {
    const direction = to >= from ? 1 : -1;
    const distance = Math.abs(to - from);
    if (prefersReducedMotion() || distance < 1) { placeTrainAt(to, direction); resolve(); return; }
    const duration = Math.min(3400, Math.max(1100, (distance / routeLength) * 4600));
    Sound.whistle(0.6);
    setTimeout(() => Sound.chug(duration / 1000 - 0.4), 300);
    mapTrain.classList.add("moving");
    mapTrain.classList.remove("idle");
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      placeTrainAt(from + (to - from) * easeInOut(t), direction);
      if (t < 1) requestAnimationFrame(step);
      else { mapTrain.classList.remove("moving"); mapTrain.classList.add("idle"); resolve(); }
    };
    requestAnimationFrame(step);
  });
}

async function travelTo(index) {
  if (traveling) return;
  if (!isRegistered()) {
    pendingStation = index;
    openPassengerDialog("Antes de viajar necesitas tu boleto de pasajero.");
    return;
  }
  if (!state.boarded) {
    pendingStation = index;
    showTicket();
    return;
  }
  traveling = true;
  $$(".map-stop").forEach((b) => b.setAttribute("aria-disabled", "true"));
  mapFrame.setAttribute("aria-busy", "true");
  const target = stationLengths[index];
  if (Math.abs(target - trainLength) > 1) setHint(`🚂 Rumbo a ${STATIONS[index].short}…`);
  if (mapFrame.getBoundingClientRect().top < -200 || mapFrame.getBoundingClientRect().bottom > window.innerHeight + 200) {
    mapFrame.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    await wait(500);
  }
  await animateTrain(trainLength, target);
  state.location = index;
  save();
  Sound.arrive();
  setHint(`Llegaste a ${STATIONS[index].short}. ✦`);
  traveling = false;
  $$(".map-stop").forEach((b) => b.removeAttribute("aria-disabled"));
  mapFrame.removeAttribute("aria-busy");
  openStation(index);
}

$$(".map-stop").forEach((button) => button.addEventListener("click", () => {
  if (traveling) return;
  Sound.click();
  travelTo(Number(button.dataset.station));
}));

window.addEventListener("resize", () => placeTrainAt(trainLength));

/* 6. Estaciones y actividades ============================================ */
let currentStation = null;

function progressMarkup() {
  const visited = state.visited.length;
  return `<div class="station-progress"><div><span>Tu recorrido · ${starCount()} de ${TOTAL} estrellas</span><strong>${visited} de ${TOTAL} estaciones</strong></div><div class="progress-track"><i style="width:${(visited / TOTAL) * 100}%"></i></div></div>`;
}

function starEarnedMarkup(index, fresh) {
  const st = STATIONS[index];
  const wagonText = fresh
    ? `🚃 ¡Se enganchó el vagón «${String(index + 1).padStart(2, "0")} · ${st.wagon}» a tu tren!`
    : `🚃 Su vagón ya viaja en tu tren.`;
  return `<div class="star-earned" role="status"><span class="big-star" aria-hidden="true">★</span><span>${fresh ? "¡Conseguiste" : "Ya tienes"} la ${st.starName}!<span class="wagon-note">${wagonText}</span></span></div>`;
}

function openStation(index) {
  const station = STATIONS[index];
  if (!station) return;
  currentStation = index;
  if (!state.visited.includes(index)) state.visited.push(index);
  // Llegar al Polo Norte otorga la Estrella Polar (antes de dibujar el progreso)
  northFreshStar = station.id === "north" && !state.stars.north;
  if (northFreshStar) { state.stars.north = true; addWagon("north"); }
  save();

  const art = $("#modalArt");
  art.className = "modal-art" + (station.id === "north" ? " north-art" : "");
  art.innerHTML = `<span>${station.art}</span>`;
  $("#modalEyebrow").textContent = `PARADA 0${index + 1} · ${station.eyebrow}`;
  $("#modalTitle").textContent = station.title;
  $("#modalDescription").textContent = station.description;

  const activity = $("#stationActivity");
  activity.innerHTML = progressMarkup() + `<div id="activityBody"></div>`;
  const body = $("#activityBody");
  ({ village: renderVillage, workshop: renderWorkshop, letter: renderLetter, tree: renderTree, north: renderNorth })[station.id](body);

  if (!stationDialog.open) stationDialog.showModal();
  $("#stationModal").scrollTop = 0;
  updateUI();
  if (station.id === "north") northArrivalEffects();
}

function refreshProgress() {
  const box = $(".station-progress");
  if (box) box.outerHTML = progressMarkup();
}

$("#closeStation").addEventListener("click", () => stationDialog.close());
$("#closeStationAction").addEventListener("click", () => stationDialog.close());
stationDialog.addEventListener("close", () => {
  Confetti.stop();
  currentStation = null;
  updateUI();
  if (newWagon) {
    const el = $(`.map-wagon[data-id="${newWagon}"]`);
    if (el) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    newWagon = null;
  }
  const stars = starCount();
  if (stars === TOTAL) setHint("★ ¡Completaste el viaje! Vuelve al Polo Norte cuando quieras para imprimir tu certificado.");
  else setHint(`✧ Llevas ${stars} de ${TOTAL} estrellas. Elige tu próxima estación.`);
});

/* --- Estación 1 · Villa Nevada: buscar y encender tres farolas --- */
const LAMP_SPOTS = [
  { left: 13.5, top: 84, label: "entre los pinos" },
  { left: 61, top: 86, label: "junto al muñeco de nieve" },
  { left: 92, top: 79, label: "al final de la calle" }
];

const LAMP_SVG = `<svg viewBox="0 0 20 48" aria-hidden="true">
  <circle class="halo" cx="10" cy="11" r="15" fill="url(#lampHalo)"/>
  <rect x="9" y="17" width="2" height="28" fill="#2b2f2c"/>
  <rect x="6" y="44" width="8" height="4" rx="1" fill="#2b2f2c"/>
  <path d="M4.5 6.5 L10 2 L15.5 6.5 Z" fill="#2b2f2c"/>
  <rect class="lantern-glass" x="6" y="6.5" width="8" height="10" rx="1" stroke="#2b2f2c" stroke-width="1.6"/>
  <path d="M7 17 H13" stroke="#2b2f2c" stroke-width="2"/>
</svg>`;

function villageSceneSVG() {
  return `<svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2033"/><stop offset="1" stop-color="#2d4b5a"/></linearGradient>
      <radialGradient id="lampHalo"><stop offset="0" stop-color="#ffe39a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
      <radialGradient id="winGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="230" fill="url(#vSky)"/>
    <g fill="#fff8e1"><circle cx="30" cy="20" r="1.2"/><circle cx="90" cy="38" r="1"/><circle cx="160" cy="16" r="1.4"/><circle cx="250" cy="30" r="1"/><circle cx="300" cy="12" r="1.3"/><circle cx="380" cy="44" r="1.1"/></g>
    <circle cx="345" cy="38" r="16" fill="#f5e7bc"/>
    <path d="M0 150 Q100 135 200 148 T400 140 V230 H0 Z" fill="#e8eee6"/>
    <g class="vglow"><circle cx="58" cy="130" r="26" fill="url(#winGlow)"/><circle cx="200" cy="110" r="30" fill="url(#winGlow)"/><circle cx="318" cy="140" r="26" fill="url(#winGlow)"/></g>
    <!-- Casa 1 -->
    <rect x="30" y="112" width="80" height="58" fill="#8b4b3a"/>
    <path d="M22 114 L70 74 L118 114 Z" fill="#3a2a2a"/><path d="M22 114 L70 74 L118 114 L112 114 L70 80 L28 114 Z" fill="#eef3ec"/>
    <rect x="88" y="80" width="10" height="22" fill="#5b3a2e"/>
    <rect class="vwin" x="42" y="124" width="16" height="16"/><rect class="vwin" x="84" y="124" width="16" height="16"/>
    <rect x="62" y="140" width="16" height="30" fill="#4a2e22"/>
    <!-- Iglesia -->
    <rect x="168" y="98" width="64" height="72" fill="#5f6f78"/>
    <path d="M160 100 L200 64 L240 100 Z" fill="#2f3438"/><path d="M160 100 L200 64 L240 100 L234 100 L200 70 L166 100 Z" fill="#eef3ec"/>
    <rect x="190" y="40" width="20" height="30" fill="#5f6f78"/><path d="M186 42 L200 22 L214 42 Z" fill="#2f3438"/>
    <circle class="vwin" cx="200" cy="54" r="5"/>
    <path class="vwin" d="M188 120 a12 12 0 0 1 24 0 V140 H188 Z"/>
    <rect x="192" y="146" width="16" height="24" fill="#3b2a22"/>
    <!-- Casa 3 -->
    <rect x="286" y="120" width="70" height="50" fill="#3f6a5a"/>
    <path d="M278 122 L321 88 L364 122 Z" fill="#2f2a2a"/><path d="M278 122 L321 88 L364 122 L358 122 L321 94 L284 122 Z" fill="#eef3ec"/>
    <rect class="vwin" x="296" y="132" width="14" height="14"/><rect class="vwin" x="332" y="132" width="14" height="14"/>
    <rect x="314" y="146" width="14" height="24" fill="#2c3f36"/>
    <!-- Guirnalda entre casas -->
    <path d="M110 116 Q139 132 168 114 M232 116 Q259 132 286 124" fill="none" stroke="#2c3a33" stroke-width="1.2"/>
    <g class="vlights"><circle cx="118" cy="121" r="2.4"/><circle cx="128" cy="125" r="2.4"/><circle cx="139" cy="127" r="2.4"/><circle cx="150" cy="125" r="2.4"/><circle cx="160" cy="120" r="2.4"/><circle cx="240" cy="121" r="2.4"/><circle cx="250" cy="125" r="2.4"/><circle cx="260" cy="127" r="2.4"/><circle cx="270" cy="127" r="2.4"/><circle cx="280" cy="125" r="2.4"/></g>
    <!-- Pozo -->
    <rect x="128" y="160" width="26" height="14" fill="#7b6e64"/><rect x="126" y="156" width="30" height="5" fill="#eef3ec"/>
    <g color="#1e4a3c"><use href="#pine" x="0" y="118" width="34" height="60"/><use href="#pine" x="368" y="104" width="36" height="66"/><use href="#pine" x="246" y="120" width="26" height="46"/></g>
  </svg>`;
}

// Elementos delanteros que esconden parcialmente las farolas
function villageFrontSVG() {
  return `<svg class="village-front" viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g color="#174034"><use href="#pine" x="36" y="150" width="38" height="66"/></g>
    <g><circle cx="232" cy="190" r="17" fill="#f7faf6"/><circle cx="232" cy="164" r="12" fill="#f7faf6"/>
      <circle cx="228" cy="161" r="1.5" fill="#222"/><circle cx="236" cy="161" r="1.5" fill="#222"/>
      <path d="M232 165 L242 167 L232 168 Z" fill="#e2803a"/><rect x="222" y="148" width="20" height="5" fill="#222"/><rect x="226" y="138" width="12" height="11" fill="#222"/>
      <path d="M220 173 Q232 179 244 173 L244 177 Q232 183 220 177 Z" fill="#a63f35"/></g>
    <path d="M340 205 Q356 186 372 196 Q386 184 400 194 V230 H340 Z" fill="#f2f6f1"/>
    <path d="M0 214 Q60 200 120 212 Q200 222 260 210 Q330 200 400 216 V230 H0 Z" fill="#f5f8f3"/>
  </svg>`;
}

function renderVillage(body) {
  const lit = state.lanterns.length;
  body.innerHTML = `<div class="activity-box">
    <span class="activity-title">La búsqueda de las tres luces</span>
    <p>Mira con atención: hay tres farolas apagadas escondidas en la villa. Tócalas para encenderlas.</p>
    <div class="village-scene ${lit === 3 ? "lit" : ""}" id="villageScene">
      ${villageSceneSVG()}
      ${LAMP_SPOTS.map((spot, i) => `<button type="button" class="lamp-spot ${state.lanterns.includes(i) ? "on" : ""}" data-lamp="${i}" style="left:${spot.left}%;top:${spot.top}%" aria-label="Farola ${i + 1} ${spot.label}: ${state.lanterns.includes(i) ? "encendida" : "apagada"}">${LAMP_SVG}</button>`).join("")}
      ${villageFrontSVG()}
    </div>
    <div class="lamp-count" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${i < lit ? "on" : ""}"></i>`).join("")}</div>
    <p class="activity-status" id="villageStatus" aria-live="polite">${lit === 3 ? "¡La villa está iluminada!" : `Farolas encendidas: ${lit}/3`}</p>
    ${lit < 3 ? `<button type="button" class="hint-button" id="lampHint">¿Necesitas una pista?</button>` : ""}
    <div id="villageReward">${state.stars.village ? starEarnedMarkup(0, false) : ""}</div>
  </div>`;

  const scene = $("#villageScene");
  const status = $("#villageStatus");

  $$(".lamp-spot", scene).forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const n = Number(btn.dataset.lamp);
    if (state.lanterns.includes(n)) { Sound.click(); status.textContent = "Esa farola ya brilla. ¡Busca las demás!"; return; }
    state.lanterns.push(n);
    save();
    btn.classList.add("on");
    btn.setAttribute("aria-label", `Farola ${n + 1} ${LAMP_SPOTS[n].label}: encendida`);
    Sound.chime(state.lanterns.length - 1);
    const count = state.lanterns.length;
    $$(".lamp-count i", body).forEach((bar, i) => bar.classList.toggle("on", i < count));
    if (count < 3) {
      status.textContent = `¡Encendiste una farola ${LAMP_SPOTS[n].label}! Farolas encendidas: ${count}/3`;
    } else {
      scene.classList.add("lit");
      status.textContent = "¡La villa está iluminada! Todas las ventanas brillan otra vez.";
      $("#lampHint")?.remove();
      const fresh = awardStar("village");
      $("#villageReward").innerHTML = starEarnedMarkup(0, fresh);
      refreshProgress();
    }
  }));

  scene.addEventListener("click", () => {
    if (state.lanterns.length < 3) { Sound.soft(); status.textContent = "Aquí no hay ninguna farola… ¡sigue buscando! 🔍"; }
  });

  $("#lampHint")?.addEventListener("click", () => {
    const missing = [0, 1, 2].find((i) => !state.lanterns.includes(i));
    const btn = $(`[data-lamp="${missing}"]`, scene);
    status.textContent = `Pista: busca ${LAMP_SPOTS[missing].label}.`;
    btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse");
    Sound.click();
  });
}

/* --- Estación 2 · Taller de Santa: envolver tres regalos --- */
function pickOrders() {
  const shuffled = [...GIFTS].sort(() => Math.random() - 0.5);
  const picked = [];
  for (const gift of shuffled) {
    if (!picked.some((p) => p.color === gift.color)) picked.push(gift);
    if (picked.length === 3) break;
  }
  return picked.map((g) => g.id);
}

function shelfMarkup() {
  return `<div class="gift-shelf" aria-label="Regalos envueltos: ${state.gifts.length} de 3">${[0, 1, 2].map((i) => {
    const g = state.gifts[i];
    return g ? `<span class="gift-box ${g.color}" title="${escapeHTML(g.id)}"></span>` : `<span class="gift-box empty"></span>`;
  }).join("")}</div>`;
}

function renderWorkshop(body, focusChoices = false) {
  if (!state.orders) { state.orders = pickOrders(); save(); }
  const done = state.gifts.length;

  if (done >= 3) {
    body.innerHTML = `<div class="activity-box workshop-complete">
      <div class="big-emoji" aria-hidden="true">🎉</div>
      <span class="activity-title">¡Todos los regalos están listos!</span>
      <p>Los duendes cargan los paquetes en el trineo y te dan las gracias por tu ayuda.</p>
      ${shelfMarkup()}
      <div>${starEarnedMarkup(1, false)}</div>
    </div>`;
    return;
  }

  const gift = GIFTS.find((g) => g.id === state.orders[done]);
  body.innerHTML = `<div class="activity-box">
    <span class="activity-title">Encargo ${done + 1} de 3</span>
    <div class="order-card">
      <span class="gift-icon" aria-hidden="true">${gift.icon}</span>
      <div><span class="order-to">PARA: ${escapeHTML(gift.to.toUpperCase())}</span><p class="order-clue">${gift.clue}</p></div>
    </div>
    <p>Elige el papel de regalo correcto:</p>
    <div class="wrap-options" role="group" aria-label="Papeles de regalo">${WRAP_COLORS.map((c) => `<button type="button" class="wrap-choice wrap-${c}" data-color="${c}">${c}</button>`).join("")}</div>
    <p class="activity-status" id="giftStatus" aria-live="polite">Lee la pista con atención.</p>
    ${shelfMarkup()}
  </div>`;

  if (focusChoices) $(".wrap-choice", body).focus();

  $$(".wrap-choice", body).forEach((btn) => btn.addEventListener("click", () => {
    const status = $("#giftStatus");
    if (btn.dataset.color === gift.color) {
      state.gifts.push({ id: gift.id, color: gift.color });
      save();
      Sound.correct();
      if (state.gifts.length === 3) {
        const fresh = awardStar("workshop");
        renderWorkshop(body);
        $(".star-earned", body).outerHTML = starEarnedMarkup(1, fresh);
        refreshProgress();
      } else {
        renderWorkshop(body, true);
        $("#giftStatus").textContent = `¡Perfecto! El regalo para ${gift.to} quedó listo. Siguiente encargo…`;
      }
    } else {
      Sound.wrong();
      btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
      status.textContent = `Mmm… el ${btn.dataset.color} no es. ¡Relee la pista! 🎨`;
      status.classList.add("wrong-answer");
    }
  }));
}

/* --- Estación 3 · Vagón de los deseos: escribir, guardar y consultar --- */
let wishType = "deseo";
let wishDraft = "";

function formatDate(iso) {
  if (!iso) return "Fecha no registrada";
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

function renderLetter(body) {
  body.innerHTML = `<div class="activity-box letter-box">
    <div class="wish-types" role="group" aria-label="Tipo de mensaje">${Object.entries(WISH_TYPES).map(([key, t]) =>
      `<button type="button" class="wish-type" data-type="${key}" aria-pressed="${key === wishType}">${t.label}</button>`).join("")}</div>
    <label for="wishText">Escribe tu mensaje</label>
    <textarea id="wishText" maxlength="500" placeholder="${WISH_TYPES[wishType].placeholder}"></textarea>
    <div class="letter-meta"><span id="letterCount">0/500</span><span>✦ Se guarda solo en este dispositivo</span></div>
    <button class="secondary-button full" id="saveWish" type="button">GUARDAR MI MENSAJE ✉</button>
    <p class="activity-status" id="wishStatus" aria-live="polite"></p>
    <div id="letterReward">${state.stars.letter ? starEarnedMarkup(2, false) : ""}</div>
  </div>
  <div class="activity-box">
    <span class="activity-title" id="wishListTitle">Mis mensajes guardados</span>
    <ul class="wish-list" id="wishList" aria-labelledby="wishListTitle"></ul>
  </div>`;

  const area = $("#wishText");
  area.value = wishDraft;
  $("#letterCount").textContent = `${area.value.length}/500`;
  area.addEventListener("input", () => { wishDraft = area.value; $("#letterCount").textContent = `${area.value.length}/500`; });

  $$(".wish-type", body).forEach((btn) => btn.addEventListener("click", () => {
    wishType = btn.dataset.type;
    $$(".wish-type", body).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    area.placeholder = WISH_TYPES[wishType].placeholder;
    Sound.click();
    area.focus();
  }));

  $("#saveWish").addEventListener("click", () => {
    const text = area.value.trim();
    const status = $("#wishStatus");
    if (!text) {
      status.textContent = "Escribe unas palabras antes de guardar.";
      status.classList.add("wrong-answer");
      Sound.wrong();
      area.focus();
      return;
    }
    status.classList.remove("wrong-answer");
    state.letters.push({ text, type: wishType, date: new Date().toISOString() });
    save();
    Sound.paper();
    const env = document.createElement("span");
    env.className = "envelope-fly";
    env.textContent = "✉️";
    env.setAttribute("aria-hidden", "true");
    area.parentElement.appendChild(env);
    setTimeout(() => env.remove(), 1400);
    area.value = ""; wishDraft = "";
    $("#letterCount").textContent = "0/500";
    status.textContent = "¡Tu mensaje quedó guardado en el vagón!";
    const fresh = awardStar("letter");
    if (fresh) { $("#letterReward").innerHTML = starEarnedMarkup(2, true); refreshProgress(); }
    renderWishList();
  });

  renderWishList();
}

function renderWishList() {
  const list = $("#wishList");
  if (!list) return;
  list.innerHTML = "";
  if (!state.letters.length) {
    list.innerHTML = `<li class="empty-note">Aún no hay mensajes. ¡El primero puede ser el tuyo!</li>`;
    return;
  }
  // Más recientes primero; se conserva el índice original para borrar
  state.letters.map((l, i) => ({ ...l, i })).reverse().forEach((letter) => {
    const li = document.createElement("li");
    const meta = document.createElement("span");
    meta.className = "wish-meta";
    meta.textContent = `${(WISH_TYPES[letter.type]?.label || "Deseo").toUpperCase()} · ${formatDate(letter.date)}`;
    const text = document.createElement("span");
    text.textContent = letter.text;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-wish";
    del.textContent = "×";
    del.setAttribute("aria-label", "Borrar este mensaje");
    del.addEventListener("click", () => {
      state.letters.splice(letter.i, 1);
      save();
      Sound.soft();
      renderWishList();
      $("#wishStatus").textContent = "Mensaje borrado.";
    });
    li.append(meta, text, del);
    list.appendChild(li);
  });
}

/* --- Estación 4 · El Gran Pino: adornar el árbol de Navidad --- */
let treeTool = "roja";

function ornamentSVG(id) {
  const ball = (color, shine = "#ffffff") => `<rect x="-3" y="-12" width="6" height="4" rx="1" fill="#c9a24f"/>
    <circle r="9" fill="${color}"/><circle cx="-3.2" cy="-3.2" r="2.6" fill="${shine}" opacity=".55"/>`;
  const shapes = {
    roja: ball("#c8453b"),
    dorada: `${ball("#d9ad58")}<path d="M-8.6 2 Q0 5 8.6 2" stroke="#9c7430" stroke-width="1.6" fill="none"/>`,
    azul: `${ball("#3a6ea5")}<path d="M-8.6 -1 Q0 2 8.6 -1" stroke="#cfe3f7" stroke-width="1.4" fill="none"/>`,
    baston: `<path d="M-1 11 V-3 A5 5 0 0 1 9 -3" stroke="#fffaf0" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M-1 11 V-3 A5 5 0 0 1 9 -3" stroke="#c8453b" stroke-width="4.5" fill="none" stroke-dasharray="2.6 2.6" stroke-linecap="butt"/>`,
    campana: `<circle cy="-10" r="2" fill="none" stroke="#9c7430" stroke-width="1.4"/>
      <path d="M-8 6 Q-8 -8 0 -8.5 Q8 -8 8 6 L10 8 H-10 Z" fill="#d9ad58" stroke="#9c7430" stroke-width="1"/>
      <circle cy="10" r="2.4" fill="#9c7430"/>`,
    mono: `<path d="M0 0 L-11 -7 L-11 7 Z M0 0 L11 -7 L11 7 Z" fill="#c8453b"/>
      <path d="M-2 2 L-6 12 M2 2 L6 12" stroke="#c8453b" stroke-width="3" stroke-linecap="round"/><circle r="3.4" fill="#9a2f28"/>`,
    estrella: `<path d="${starPath(0, 1, 12, 5)}" fill="#ffd166" stroke="#b0802e" stroke-width="1.4"/>`
  };
  return `<svg viewBox="-13 -13 26 26" aria-hidden="true">${shapes[id]}</svg>`;
}

function treeSceneSVG() {
  const lights = [];
  // Guirnalda de luces en tres vueltas
  [[112, 188, 120], [92, 208, 186], [70, 230, 254]].forEach(([x1, x2, y], row) => {
    const steps = 6 + row * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const sag = Math.sin(t * Math.PI) * 9;
      lights.push(`<circle cx="${x.toFixed(1)}" cy="${(y - 14 + sag).toFixed(1)}" r="3"/>`);
    }
  });
  return `<svg viewBox="0 0 300 340" aria-hidden="true">
    <defs>
      <linearGradient id="tSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2033"/><stop offset="1" stop-color="#2d4b5a"/></linearGradient>
      <radialGradient id="tGlow"><stop offset="0" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
      <linearGradient id="tGreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f5a45"/><stop offset=".5" stop-color="#2d7a5c"/><stop offset="1" stop-color="#1b4f3d"/></linearGradient>
    </defs>
    <rect width="300" height="340" fill="url(#tSky)"/>
    <g fill="#fff8e1"><circle cx="24" cy="30" r="1.2"/><circle cx="60" cy="80" r="1"/><circle cx="250" cy="26" r="1.4"/><circle cx="276" cy="90" r="1"/><circle cx="34" cy="150" r="1.1"/><circle cx="268" cy="160" r="1.2"/></g>
    <circle class="tree-glow" cx="150" cy="170" r="150" fill="url(#tGlow)"/>
    <path d="M0 290 Q150 278 300 290 V340 H0 Z" fill="#e8eee6"/>
    <rect x="137" y="258" width="26" height="36" fill="#5b3a2e"/>
    <path d="M60 262 L150 140 L240 262 Z" fill="url(#tGreen)"/>
    <path d="M60 262 Q80 254 98 262 Q118 252 138 262 Q160 252 180 262 Q202 252 222 262 Q232 256 240 262 L236 268 Q150 276 64 268 Z" fill="#eef3ec"/>
    <path d="M85 190 L150 85 L215 190 Z" fill="url(#tGreen)"/>
    <path d="M85 190 Q102 183 118 190 Q134 182 150 190 Q166 182 182 190 Q198 183 215 190 L211 195 Q150 202 89 195 Z" fill="#eef3ec"/>
    <path d="M105 125 L150 40 L195 125 Z" fill="url(#tGreen)"/>
    <path d="M105 125 Q120 119 135 125 Q150 118 165 125 Q180 119 195 125 L191 130 Q150 136 109 130 Z" fill="#eef3ec"/>
    <g class="tlights">${lights.join("")}</g>
    <g class="tree-gifts">
      <rect x="70" y="276" width="34" height="26" fill="#a63f35"/><rect x="84" y="276" width="6" height="26" fill="#f4e8cf"/>
      <rect x="196" y="270" width="40" height="32" fill="#3a6ea5"/><rect x="213" y="270" width="6" height="32" fill="#f4e8cf"/>
      <rect x="166" y="284" width="26" height="20" fill="#d9ad58"/><rect x="176" y="284" width="5" height="20" fill="#f4e8cf"/>
      <rect x="108" y="286" width="24" height="18" fill="#2f7a4c"/><rect x="117" y="286" width="5" height="18" fill="#f4e8cf"/>
    </g>
  </svg>`;
}

function treeCount() { return Object.keys(state.tree.ornaments).length; }

function treeStatusText() {
  const n = treeCount();
  if (state.tree.lit) return "¡El Gran Pino brilla en la plaza! Puedes seguir cambiando sus adornos.";
  const parts = [`Adornos: ${Math.min(n, TREE_GOAL)}/${TREE_GOAL}`, `Estrella: ${state.tree.topper ? "✓" : "pendiente"}`];
  if (n >= TREE_GOAL && state.tree.topper) return "¡Listo! Ya puedes encender el árbol ✨";
  return parts.join(" · ");
}

function spotLabel(i) {
  const where = i === 0 ? "Punta del árbol" : `Rama ${i}`;
  const value = i === 0 ? (state.tree.topper ? "con estrella" : "vacía") : (state.tree.ornaments[i] ? ORNAMENTS[state.tree.ornaments[i]].label.toLowerCase() : "vacía");
  return `${where}: ${value}`;
}

function renderTree(body) {
  const lit = state.tree.lit;
  body.innerHTML = `<div class="activity-box">
    <span class="activity-title">Adorna el Gran Pino</span>
    <p>1) Elige un adorno. 2) Toca una rama para colgarlo (tócalo otra vez para quitarlo). Coloca al menos ${TREE_GOAL} adornos y la estrella en la punta.</p>
    <div class="ornament-palette" role="group" aria-label="Adornos">
      ${Object.entries(ORNAMENTS).map(([id, o]) => `<button type="button" class="ornament-pick" data-tool="${id}" aria-pressed="${id === treeTool}" title="${o.label}">${ornamentSVG(id)}<span>${o.label.replace("Esfera ", "").replace(" de caramelo", "")}</span></button>`).join("")}
    </div>
    <div class="tree-scene ${lit ? "lit" : ""}" id="treeScene">
      ${treeSceneSVG()}
      ${TREE_SPOTS.map(([x, y], i) => {
        const filled = i === 0 ? state.tree.topper : Boolean(state.tree.ornaments[i]);
        const content = i === 0 ? (state.tree.topper ? ornamentSVG("estrella") : "") : (filled ? ornamentSVG(state.tree.ornaments[i]) : "");
        return `<button type="button" class="tree-spot ${i === 0 ? "top" : ""} ${filled ? "filled" : ""}" data-spot="${i}" style="left:${(x / 300) * 100}%;top:${(y / 340) * 100}%" aria-label="${spotLabel(i)}">${content}</button>`;
      }).join("")}
    </div>
    <p class="activity-status" id="treeStatus" aria-live="polite">${treeStatusText()}</p>
    <button class="primary-button full" id="lightTree" type="button" ${lit || treeCount() < TREE_GOAL || !state.tree.topper ? "disabled" : ""}>${lit ? "✨ ÁRBOL ENCENDIDO" : "✨ ENCENDER EL ÁRBOL"}</button>
    <button class="hint-button" id="clearTree" type="button">Quitar todos los adornos</button>
    <div id="treeReward">${state.stars.tree ? starEarnedMarkup(3, false) : ""}</div>
  </div>`;

  const scene = $("#treeScene");
  const status = $("#treeStatus");
  const lightBtn = $("#lightTree");
  const refresh = () => {
    status.textContent = treeStatusText();
    status.classList.remove("wrong-answer");
    const ready = treeCount() >= TREE_GOAL && state.tree.topper;
    if (!state.tree.lit) lightBtn.disabled = !ready;
  };
  const warn = (msg) => { status.textContent = msg; status.classList.add("wrong-answer"); Sound.wrong(); };

  $$(".ornament-pick", body).forEach((btn) => btn.addEventListener("click", () => {
    treeTool = btn.dataset.tool;
    $$(".ornament-pick", body).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    Sound.click();
  }));

  $$(".tree-spot", scene).forEach((btn) => btn.addEventListener("click", () => {
    const i = Number(btn.dataset.spot);
    if (i === 0) {
      if (state.tree.topper) {
        if (treeTool !== "estrella") return warn("En la punta solo va la estrella. Para quitarla, elige la estrella y toca la punta.");
        state.tree.topper = false;
        btn.innerHTML = ""; btn.classList.remove("filled");
        Sound.soft();
      } else {
        if (treeTool !== "estrella") return warn("La punta está reservada para la estrella ⭐. ¡Elígela en los adornos!");
        state.tree.topper = true;
        btn.innerHTML = ornamentSVG("estrella"); btn.classList.add("filled", "placed");
        Sound.star();
      }
    } else {
      if (treeTool === "estrella") return warn("La estrella va en la punta del árbol. ¡Tócala arriba!");
      if (state.tree.ornaments[i] === treeTool) {
        delete state.tree.ornaments[i];
        btn.innerHTML = ""; btn.classList.remove("filled");
        Sound.soft();
      } else {
        state.tree.ornaments[i] = treeTool;
        btn.innerHTML = ornamentSVG(treeTool);
        btn.classList.add("filled");
        btn.classList.remove("placed"); void btn.offsetWidth; btn.classList.add("placed");
        Sound.chime(i % 3);
      }
    }
    btn.setAttribute("aria-label", spotLabel(i));
    save();
    refresh();
  }));

  lightBtn.addEventListener("click", () => {
    if (state.tree.lit) return;
    state.tree.lit = true;
    save();
    scene.classList.add("lit");
    lightBtn.disabled = true;
    lightBtn.textContent = "✨ ÁRBOL ENCENDIDO";
    status.textContent = treeStatusText();
    const fresh = awardStar("tree");
    if (!fresh) Sound.fanfare();
    Confetti.burst($("#confetti"), { count: 90, duration: 3200 });
    $("#treeReward").innerHTML = starEarnedMarkup(3, fresh);
    refreshProgress();
  });

  $("#clearTree").addEventListener("click", () => {
    state.tree.ornaments = {};
    state.tree.topper = false;
    save();
    Sound.soft();
    renderTree(body);
    $("#treeStatus").textContent = state.tree.lit
      ? "Quitaste los adornos. El árbol sigue encendido: ¡vuelve a decorarlo a tu gusto!"
      : treeStatusText();
  });
}

/* --- Estación 5 · Polo Norte: progreso, estrellas y certificado --- */
let northFreshStar = false;

function renderNorth(body) {
  const complete = starCount() === TOTAL;
  const name = escapeHTML(state.name || "Pasajero");

  body.innerHTML = `
    <div class="arrival-banner">
      <strong>${complete ? `¡Santa te da la bienvenida, ${name}!` : `¡Bienvenido al Polo Norte, ${name}!`}</strong>
      <p>${complete ? "Encendiste la villa, ayudaste a los duendes, dejaste tu deseo y adornaste el Gran Pino. ¡Misión cumplida!" : "Ya llegaste al destino, pero aún quedan estrellas por conseguir en el camino."}</p>
    </div>
    ${northFreshStar ? starEarnedMarkup(TOTAL - 1, true) : ""}
    <div class="star-row" role="list" aria-label="Estrellas del viaje">
      ${STATIONS.map((st, i) => `<div class="star-slot ${state.stars[st.id] ? "on" : ""}" role="listitem" style="--d:${i}">
        <span aria-hidden="true" style="animation-delay:${i * 0.15}s">★</span><small>${st.starName}<span class="sr-only">: ${state.stars[st.id] ? "conseguida" : "pendiente"}</span></small></div>`).join("")}
    </div>
    <ul class="route-check">
      ${STATIONS.slice(0, TOTAL - 1).map((st, i) => `<li><b>${pad(i + 1)} · ${st.short}</b>${isComplete(i)
        ? `<span class="ok">✓ Completada</span>`
        : `<button type="button" class="go" data-go="${i}">IR AHORA →</button>`}</li>`).join("")}
    </ul>
    ${certificateMarkup()}
    <button class="primary-button full" id="downloadCertificate" type="button">⬇ DESCARGAR CERTIFICADO (IMAGEN PNG)</button>
    <button class="secondary-button full" id="printCertificate" type="button" style="margin-top:10px">🖨 IMPRIMIR</button>
    <p class="activity-status" id="certStatus" aria-live="polite">La imagen se guarda directamente en tus descargas.</p>`;

  $$("[data-go]", body).forEach((btn) => btn.addEventListener("click", () => {
    const target = Number(btn.dataset.go);
    stationDialog.close();
    travelTo(target);
  }));
  $("#printCertificate").addEventListener("click", printCertificate);
  $("#downloadCertificate").addEventListener("click", downloadCertificate);
}

function northArrivalEffects() {
  if (northFreshStar) { Sound.star(); const hud = $("#hud"); hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump"); }
  if (starCount() === TOTAL) {
    setTimeout(() => { Sound.fanfare(); Confetti.burst($("#confetti")); }, 250);
  }
}

/* 7. Certificado ========================================================= */
function certificateMarkup() {
  const complete = starCount() === TOTAL;
  const today = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  return `<div class="certificate">
    <div class="certificate-star" aria-hidden="true">✦</div>
    <p class="cert-org">FERROCARRIL DEL POLO NORTE</p>
    <h3>Certificado de viajero</h3>
    <p class="cert-intro">Se otorga el presente reconocimiento a</p>
    <span class="certificate-name">${escapeHTML(state.name || "Pasajero")}</span>
    <p>por completar una aventura a bordo del Expreso de Navidad llena de ilusión, generosidad y espíritu navideño.</p>
    <div class="certificate-stats">
      <span><b>${state.visited.length}/${TOTAL}</b> estaciones</span>
      <span><b>${starCount()}/${TOTAL}</b> estrellas</span>
      <span><b>${state.letters.length}</b> ${state.letters.length === 1 ? "deseo" : "deseos"}</span>
    </div>
    <strong class="certificate-seal">${complete ? "★ ¡MISIÓN CUMPLIDA! ★" : "VIAJERO DEL POLO NORTE"}</strong>
    <div class="certificate-foot"><span>Boleto ${escapeHTML(state.code || "—")}</span><span>Polo Norte, ${today}</span></div>
  </div>`;
}

function printCertificate() {
  Sound.click();
  $("#printArea").innerHTML = certificateMarkup();
  window.print();
}

/* 7b. Vagones de estrellas =============================================== */
// Cada actividad completada engancha un vagón con su estrella y su número.
const WAGON_PITCH = 116;   // ancho del vagón + enganche (unidades del SVG)
const PASSENGER_LEFT = 14; // borde izquierdo del vagón de pasajeros
const TRAIN_RIGHT = 512;   // punta del quitanieves

function wheelMarkup(cx) {
  return `<g><circle cx="${cx}" cy="314" r="15" fill="#292d29" stroke="#d9ad58" stroke-width="3"/>
    <g class="spokes"><path d="M${cx} 300 V328 M${cx - 14} 314 H${cx + 14} M${cx - 10} 304 L${cx + 10} 324 M${cx + 10} 304 L${cx - 10} 324" stroke="#d9ad58" stroke-width="1.6"/></g>
    <circle cx="${cx}" cy="314" r="3.5" fill="#d9ad58"/></g>`;
}

function heroWagonMarkup(id, slot) {
  const index = STATIONS.findIndex((st) => st.id === id);
  const st = STATIONS[index];
  const x = PASSENGER_LEFT + 8 - 12 - 104 - slot * WAGON_PITCH; // a la izquierda del vagón de pasajeros
  const label = `${String(index + 1).padStart(2, "0")} · ${st.wagon}`;
  return `<g class="wagon ${id === newWagon ? "new" : ""}">
    <rect x="${x + 104}" y="280" width="12" height="6" fill="#2b2f2c"/>
    <rect x="${x - 4}" y="212" width="112" height="14" rx="7" fill="#3a2a28" stroke="#d9ad58" stroke-width="3"/>
    <rect x="${x}" y="222" width="104" height="70" rx="6" fill="${st.color}" stroke="#d9ad58" stroke-width="4"/>
    <rect x="${x + 9}" y="230" width="86" height="52" rx="4" fill="#00000026" stroke="#f4e8cf55" stroke-width="1.5"/>
    <g class="wagon-star"><circle cx="${x + 52}" cy="250" r="15" fill="#f4e8cf"/>
      <path d="${starPath(x + 52, 251, 11, 4.6)}" fill="#d9ad58"/></g>
    <text x="${x + 52}" y="277" text-anchor="middle" fill="#f4e8cf" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="11" letter-spacing="1">${label}</text>
    <rect x="${x}" y="284" width="104" height="5" fill="#00000040"/>
    ${wheelMarkup(x + 24)}${wheelMarkup(x + 80)}
  </g>`;
}

// Estrella de 5 puntas como path SVG
function starPath(cx, cy, outer, inner) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + "Z";
}

function renderHeroWagons() {
  const n = state.wagons.length;
  $("#heroWagons").innerHTML = state.wagons.map((id, slot) => heroWagonMarkup(id, slot)).join("");
  // Escala el tren para que quepa completo en la escena, sin despegarse de la vía (y = 330)
  const minX = n ? PASSENGER_LEFT + 8 - 12 - 104 - (n - 1) * WAGON_PITCH - 4 : PASSENGER_LEFT;
  const width = TRAIN_RIGHT - minX;
  const scale = Math.min(1, 560 / width);
  const tx = (640 - width * scale) / 2 - minX * scale;
  const ty = 330 * (1 - scale);
  $("#trainLayout").style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
  const scene = $(".scene");
  scene.setAttribute("aria-label", `Una locomotora roja ${n ? `con ${n} ${n === 1 ? "vagón" : "vagones"} de estrellas ` : ""}viaja de noche por un paisaje nevado con montañas, pinos y un pueblo iluminado`);
}

function mapWagonSVG(index) {
  const st = STATIONS[index];
  return `<svg viewBox="0 0 50 34" aria-hidden="true">
    <rect x="1" y="3" width="48" height="5" rx="2.5" fill="#3a2a28"/>
    <rect x="3" y="6" width="44" height="20" rx="3" fill="${st.color}" stroke="#d9ad58" stroke-width="2"/>
    <path d="${starPath(14, 16, 6.5, 2.7)}" fill="#ffd166"/>
    <text x="33" y="20" text-anchor="middle" fill="#f4e8cf" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="10">${String(index + 1).padStart(2, "0")}</text>
    <g fill="#292d29" stroke="#d9ad58" stroke-width="1.5"><circle cx="13" cy="29" r="4.5"/><circle cx="37" cy="29" r="4.5"/></g>
  </svg>`;
}

function renderMapWagons() {
  const box = $("#mapWagons");
  box.innerHTML = state.wagons.map((id) => {
    const index = STATIONS.findIndex((st) => st.id === id);
    return `<div class="map-wagon" data-id="${id}" title="Vagón ${String(index + 1).padStart(2, "0")} · ${STATIONS[index].short}">${mapWagonSVG(index)}</div>`;
  }).join("");
  positionMapWagons();
}

// Los vagones siguen al tren por la vía, uno detrás de otro
function positionMapWagons() {
  const wagons = $$(".map-wagon");
  if (!routeLength || !wagons.length) return;
  const rect = mapFrame.getBoundingClientRect();
  const sx = rect.width / VIEW_W, sy = rect.height / VIEW_H;
  const small = window.matchMedia("(max-width: 560px)").matches;
  const firstGap = small ? 40 : 52, gap = small ? 35 : 45;
  const px = (l) => { const p = routePath.getPointAtLength(l); return { x: p.x * sx, y: p.y * sy, raw: p }; };
  let length = trainLength;
  let prev = px(length);
  wagons.forEach((el, i) => {
    const need = i === 0 ? firstGap : gap;
    let next = prev;
    while (true) {
      const candidate = length - trainDirection * 2;
      if (candidate < 0 || candidate > routeLength) break;
      length = candidate;
      next = px(length);
      if (Math.hypot(next.x - prev.x, next.y - prev.y) >= need) break;
    }
    const a = routePath.getPointAtLength(Math.max(0, length - 3));
    const b = routePath.getPointAtLength(Math.min(routeLength, length + 3));
    let angle = (Math.atan2((b.y - a.y) * sy, (b.x - a.x) * sx) * 180) / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    angle = Math.max(-40, Math.min(40, angle));
    el.style.left = `${(next.raw.x / VIEW_W) * 100}%`;
    el.style.top = `${(next.raw.y / VIEW_H) * 100}%`;
    el.style.transform = `translate(-50%, -78%) rotate(${angle}deg)`;
    prev = next;
  });
}

/* 7c. Certificado como imagen PNG ======================================== */
async function drawCertificateCanvas() {
  try {
    await Promise.race([
      Promise.all(["600 60px Cinzel", "700 30px Cinzel", "400 30px Nunito", "800 30px Nunito"].map((f) => document.fonts.load(f))),
      wait(2500)
    ]);
  } catch { /* sin conexión: se usan fuentes de respaldo */ }

  const W = 2000, H = 1414;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d");
  const TITLE = "Cinzel, Georgia, 'Times New Roman', serif";
  const BODY = "Nunito, 'Segoe UI', Roboto, Arial, sans-serif";
  const spacing = (px) => { if ("letterSpacing" in c) c.letterSpacing = `${px}px`; };
  const text = (str, x, y, font, color, align = "center", ls = 0) => {
    c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = "middle"; spacing(ls); c.fillText(str, x, y); spacing(0);
  };

  // Fondo de pergamino
  const bg = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, "#fffaf0"); bg.addColorStop(1, "#ead9b6");
  c.fillStyle = bg; c.fillRect(0, 0, W, H);

  // Copos decorativos tenues (posiciones fijas)
  c.globalAlpha = 0.09;
  for (let i = 0; i < 40; i++) {
    const x = 140 + ((i * 397) % (W - 280)), y = 140 + ((i * 251) % (H - 280));
    text("❄", x, y, `${26 + (i % 4) * 10}px serif`, "#7a8f86");
  }
  c.globalAlpha = 1;

  // Marcos dorados
  c.strokeStyle = "#bd995d"; c.lineWidth = 16; c.strokeRect(44, 44, W - 88, H - 88);
  c.lineWidth = 4; c.strokeRect(78, 78, W - 156, H - 156);
  c.strokeStyle = "#ffffffaa"; c.lineWidth = 3; c.strokeRect(92, 92, W - 184, H - 184);
  [[140, 140], [W - 140, 140], [140, H - 140], [W - 140, H - 140]].forEach(([x, y]) => text("✦", x, y, "54px serif", "#bd995d"));

  const complete = starCount() === TOTAL;
  const name = state.name || "Pasajero";
  const today = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

  text("✦", W / 2, 205, "84px serif", "#b28a48");
  text("FERROCARRIL DEL POLO NORTE", W / 2, 290, `700 30px ${TITLE}`, "#987344", "center", 8);
  text("Certificado de viajero", W / 2, 375, `600 96px ${TITLE}`, "#334b3d");
  text("Se otorga el presente reconocimiento a", W / 2, 465, `400 36px ${BODY}`, "#6b6a5c");

  c.strokeStyle = "#cbb58e"; c.lineWidth = 3;
  [510, 670].forEach((y) => { c.beginPath(); c.moveTo(380, y); c.lineTo(W - 380, y); c.stroke(); });
  let size = 120;
  c.font = `600 ${size}px ${TITLE}`;
  while (c.measureText(name).width > 1180 && size > 50) { size -= 4; c.font = `600 ${size}px ${TITLE}`; }
  text(name, W / 2, 592, `600 ${size}px ${TITLE}`, "#9b473d");

  // Texto con ajuste de línea
  c.font = `400 38px ${BODY}`;
  const words = "por completar una aventura a bordo del Expreso de Navidad llena de ilusión, generosidad y espíritu navideño.".split(" ");
  const lines = [];
  let line = "";
  words.forEach((w) => { const test = line ? `${line} ${w}` : w; if (c.measureText(test).width > 1300) { lines.push(line); line = w; } else line = test; });
  lines.push(line);
  lines.forEach((l, i) => text(l, W / 2, 740 + i * 54, `400 38px ${BODY}`, "#465345"));

  // Medallas de estrellas con número de estación
  STATIONS.forEach((st, i) => {
    const cx = W / 2 + (i - (TOTAL - 1) / 2) * (TOTAL > 4 ? 270 : 300), cy = 925;
    const on = state.stars[st.id];
    const g = c.createRadialGradient(cx - 18, cy - 18, 8, cx, cy, 70);
    g.addColorStop(0, on ? "#f6d98e" : "#eee6d6"); g.addColorStop(1, on ? "#c2913c" : "#d8ccb6");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 64, 0, Math.PI * 2); c.fill();
    c.strokeStyle = on ? "#9c7430" : "#c9bca3"; c.lineWidth = 4; c.stroke();
    c.fillStyle = on ? "#fffaf0" : "#f7f2e8";
    c.fill(new Path2D(starPath(cx, cy + 3, 40, 17)));
    text(String(i + 1).padStart(2, "0"), cx, cy + 4, `700 24px ${TITLE}`, on ? "#8a5f1f" : "#b3a68e");
    text(st.starName, cx, cy + 98, `800 ${TOTAL > 4 ? 23 : 25}px ${BODY}`, on ? "#5b4a2a" : "#a99d87");
  });

  text(`${state.visited.length}/${TOTAL} estaciones   ·   ${starCount()}/${TOTAL} estrellas   ·   ${state.letters.length} ${state.letters.length === 1 ? "deseo" : "deseos"}`,
    W / 2, 1102, `700 34px ${BODY}`, "#405845");

  // Sello
  c.save();
  c.translate(W / 2, 1192); c.rotate(-0.05);
  const seal = complete ? "★ ¡MISIÓN CUMPLIDA! ★" : "VIAJERO DEL POLO NORTE";
  c.font = `700 36px ${TITLE}`; spacing(3);
  const sw = c.measureText(seal).width + 60;
  spacing(0);
  c.strokeStyle = "#a44c40"; c.lineWidth = 4; c.strokeRect(-sw / 2, -36, sw, 72);
  c.lineWidth = 1.5; c.strokeRect(-sw / 2 + 8, -28, sw - 16, 56);
  text(seal, 0, 2, `700 36px ${TITLE}`, "#a44c40", "center", 3);
  c.restore();

  text(`Boleto ${state.code || "—"}`, 190, 1290, `400 28px ${BODY}`, "#8b806d", "left");
  text(`Polo Norte, ${today}`, W - 190, 1290, `400 28px ${BODY}`, "#8b806d", "right");
  return canvas;
}

function certificateFileName() {
  const slug = (state.name || "Pasajero").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `Certificado_Expreso_de_Navidad_${slug || "Pasajero"}.png`;
}

async function downloadCertificate() {
  const btn = $("#downloadCertificate");
  const status = $("#certStatus");
  btn.disabled = true;
  btn.textContent = "GENERANDO TU CERTIFICADO…";
  try {
    const canvas = await drawCertificateCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const link = document.createElement("a");
    link.download = certificateFileName();
    link.href = blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (blob) setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    Sound.correct();
    status.textContent = "¡Listo! Tu certificado se descargó como imagen PNG.";
  } catch (error) {
    status.textContent = "No se pudo generar la imagen. Intenta con el botón Imprimir.";
    status.classList.add("wrong-answer");
  } finally {
    btn.disabled = false;
    btn.textContent = "⬇ DESCARGAR CERTIFICADO (IMAGEN PNG)";
  }
}

/* 8. Controles de sonido e inicio ======================================= */
function syncSoundButtons() {
  const sfx = $("#sfxToggle");
  sfx.setAttribute("aria-pressed", String(prefs.sfx));
  sfx.title = prefs.sfx ? "Desactivar efectos de sonido" : "Activar efectos de sonido";
  const music = $("#musicToggle");
  music.setAttribute("aria-pressed", String(Sound.musicOn));
  music.title = Sound.musicOn ? "Detener la música" : "Activar música ambiental";
  music.innerHTML = Sound.musicOn ? "♫ <span>Música activada</span>" : "♫ <span>Música</span>";
}

$("#sfxToggle").addEventListener("click", () => {
  prefs.sfx = !prefs.sfx;
  Sound.setSfx(prefs.sfx);
  writeStorage(PREFS_KEY, prefs);
  syncSoundButtons();
  if (prefs.sfx) Sound.click();
});
$("#musicToggle").addEventListener("click", () => { Sound.toggleMusic(); syncSoundButtons(); });

document.addEventListener("visibilitychange", () => (document.hidden ? Sound.suspend() : Sound.resume()));

if (!Sound.supported) {
  $("#musicToggle").disabled = true;
  $("#sfxToggle").disabled = true;
}

Sound.setSfx(prefs.sfx);
syncSoundButtons();
Snow.init($("#snow"));
renderHeroWagons();
renderMapWagons();
setupMap();
mapTrain.classList.add("idle");
updateUI();
if (isRegistered() && state.boarded) setHint(`✧ ¡Hola de nuevo, ${state.name}! Llevas ${starCount()} de ${TOTAL} estrellas.`);
