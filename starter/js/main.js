"use strict";

//config paths and fallback paths
const DATA_ROOT = "./starter/data/";
const IMAGES_BASE = "./starter/images/";

const ABOUT_URL = DATA_ROOT + "aboutMeData.json";
const PROJECTS_URL = DATA_ROOT + "projectsData.json";

const CARD_PLACEHOLDER = IMAGES_BASE + "card_placeholder_bg.webp";
const SPOTLIGHT_PLACEHOLDER = IMAGES_BASE + "spotlight_placeholder_bg.webp";

//state
let projects = [];
let byId = new Map();
let selectedId = null;

//boot
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    await loadAbout();
    await loadProjects();
    wireCardEvents();
    wireArrows();
    wireFormValidation();
  } catch (e) {
    console.error("Init error:", e);
  }
}

/* =========================
   Utils
========================= */
// Take any path like "../images/foo.webp" or "starter/images/foo.webp"
// and return "./starter/images/foo.webp"
function toImagesBasePath(u) {
  if (!u || typeof u !== "string") return "";
  const name = u.split("/").pop(); // keep filename only
  return name ? IMAGES_BASE + name : "";
}

function clear(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}
function setText(node, text) {
  if (!node) return;
  clear(node);
  node.appendChild(document.createTextNode(String(text)));
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

//about me
async function loadAbout() {
  let data;
  try {
    data = await fetchJSON(ABOUT_URL);
  } catch {
    data = {
      aboutMe: "Hello! I’m a developer building cool things.",
      headshot: "",
    };
  }

  const about = document.getElementById("aboutMe");
  if (!about) return;

  const p = document.createElement("p");
  p.textContent =
    (data.aboutMe && data.aboutMe.trim()) ||
    "Hello! I’m a developer building cool things.";

  const headshotWrap = document.createElement("div");
  headshotWrap.className = "headshotContainer";

  if (data.headshot) {
    const img = document.createElement("img");
    img.src = toImagesBasePath(data.headshot) || CARD_PLACEHOLDER;
    img.alt = "Headshot";
    img.loading = "lazy";
    headshotWrap.appendChild(img);
  }

  about.append(p, headshotWrap);
}

//Projects (cards and spotlight)
async function loadProjects() {
  let raw = [];
  try {
    raw = await fetchJSON(PROJECTS_URL);
  } catch {
    raw = [];
  }

  projects = raw.map(normalizeProject);
  byId = new Map(projects.map((p) => [p.project_id, p]));

  const list = document.getElementById("projectList"); // <sidebar id="projectList">
  if (!list) return;

  const frag = document.createDocumentFragment();

  projects.forEach((proj, i) => {
    const card = document.createElement("div");
    card.className = "projectCard";
    card.dataset.id = proj.project_id;
    card.tabIndex = 0;

    // background image
    card.style.backgroundImage = `url('${
      proj.card_image || CARD_PLACEHOLDER
    }')`;
    card.style.backgroundSize = "cover";
    card.style.backgroundPosition = "center";

    const h4 = document.createElement("h4");
    h4.textContent = proj.project_name;

    const teaser = document.createElement("p");
    teaser.textContent = proj.short_description;

    card.append(h4, teaser);
    frag.appendChild(card);

    if (i === 0) selectedId = proj.project_id;
  });

  list.appendChild(frag);
  if (selectedId) updateSpotlight(selectedId);
}

function normalizeProject(p) {
  const cardImg = toImagesBasePath(p.card_image);
  const spotImg = toImagesBasePath(p.spotlight_image);

  return {
    project_id: p.project_id ?? crypto.randomUUID(),
    project_name:
      (p.project_name && p.project_name.trim()) || "Untitled Project",
    short_description:
      (p.short_description && p.short_description.trim()) ||
      "No description available.",
    long_description:
      (p.long_description && p.long_description.trim()) ||
      "Details coming soon.",
    card_image: cardImg || CARD_PLACEHOLDER,
    spotlight_image: spotImg || SPOTLIGHT_PLACEHOLDER,
    url: typeof p.url === "string" ? p.url : "",
  };
}

/* ---------- Spotlight ---------- */
function ensureSpotlightNodes() {
  const spotlight = document.getElementById("projectSpotlight");
  const titleBox = document.getElementById("spotlightTitles");
  if (!spotlight || !titleBox) return {};

  let h3 = titleBox.querySelector("h3");
  if (!h3) {
    h3 = document.createElement("h3");
    titleBox.appendChild(h3);
  }

  let desc = spotlight.querySelector('[data-role="spot-desc"]');
  if (!desc) {
    desc = document.createElement("p");
    desc.setAttribute("data-role", "spot-desc");
    spotlight.appendChild(desc);
  }

  let link = spotlight.querySelector('[data-role="spot-link"]');
  if (!link) {
    link = document.createElement("a");
    link.setAttribute("data-role", "spot-link");
    spotlight.appendChild(link);
  }

  return { spotlight, h3, desc, link };
}

function updateSpotlight(id) {
  const proj = byId.get(id);
  if (!proj) return;
  selectedId = id;

  const nodes = ensureSpotlightNodes();
  const { spotlight, h3, desc, link } = nodes;
  if (!spotlight) return;

  spotlight.style.backgroundImage = `url('${
    proj.spotlight_image || SPOTLIGHT_PLACEHOLDER
  }')`;
  spotlight.style.backgroundSize = "cover";
  spotlight.style.backgroundPosition = "center";

  h3.textContent = proj.project_name;
  desc.textContent = proj.long_description;

  if (proj.url) {
    link.href = proj.url;
    link.textContent = "Click here to see more...";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.pointerEvents = "";
    link.setAttribute("aria-disabled", "false");
  } else {
    removeAllAttrsExceptDataRole(link);
    link.textContent = "No link available";
    link.style.pointerEvents = "none";
    link.setAttribute("aria-disabled", "true");
  }

  const list = document.getElementById("projectList");
  if (list) {
    list.querySelectorAll(".projectCard").forEach((c) => {
      c.classList.toggle("active", c.dataset.id === id);
      c.classList.toggle("inactive", c.dataset.id !== id);
    });
  }
}

function removeAllAttrsExceptDataRole(el) {
  if (!el) return;
  const rm = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.name !== "data-role") rm.push(a.name);
  }
  rm.forEach((n) => el.removeAttribute(n));
}

//events
function wireCardEvents() {
  const list = document.getElementById("projectList");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const card = e.target.closest(".projectCard");
    if (card) updateSpotlight(card.dataset.id);
  });

  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".projectCard");
      if (card) {
        e.preventDefault();
        updateSpotlight(card.dataset.id);
      }
    }
  });
}

function wireArrows() {
  const left = document.querySelector(".arrow-left");
  const right = document.querySelector(".arrow-right");
  const list = document.getElementById("projectList");
  if (!left || !right || !list) return;

  const mqDesktop = window.matchMedia("(min-width: 1024px)");
  const page = () =>
    (mqDesktop.matches ? list.clientHeight : list.clientWidth) * 0.9;

  const scroll = (dir) => {
    if (mqDesktop.matches)
      list.scrollBy({ top: dir * page(), behavior: "smooth" });
    else list.scrollBy({ left: dir * page(), behavior: "smooth" });
  };

  left.addEventListener("click", () => scroll(-1));
  right.addEventListener("click", () => scroll(1));
}

//form validation
function wireFormValidation() {
  const form = document.querySelector("form#formSection");
  if (!form) return;

  const email = document.getElementById("contactEmail");
  const message = document.getElementById("contactMessage");
  const emailError = document.getElementById("emailError");
  const messageError = document.getElementById("messageError");
  const counter = document.getElementById("charactersLeft");

  const ILLEGAL = /[^a-zA-Z0-9@._-]/;
  const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function updateCounter() {
    const len = (message.value || "").length;
    setText(counter, `Characters: ${len}/300`);
    counter.classList.toggle("error", len > 300);
  }
  updateCounter();
  message.addEventListener("input", updateCounter);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;

    const ev = (email.value || "").trim();
    if (!ev) {
      setText(emailError, "Email cannot be empty.");
      ok = false;
    } else if (!VALID_EMAIL.test(ev)) {
      setText(emailError, "Please enter a valid email address.");
      ok = false;
    } else if (ILLEGAL.test(ev)) {
      setText(emailError, "Email contains illegal characters.");
      ok = false;
    } else {
      setText(emailError, "");
    }

    const mv = message.value || "";
    if (!mv.trim()) {
      setText(messageError, "Message cannot be empty.");
      ok = false;
    } else if (ILLEGAL.test(mv)) {
      setText(messageError, "Message contains illegal characters.");
      ok = false;
    } else if (mv.length > 300) {
      setText(messageError, "Message must be 300 characters or fewer.");
      ok = false;
    } else {
      setText(messageError, "");
    }

    if (ok) alert("Form validation passed! ✅");
  });
}
