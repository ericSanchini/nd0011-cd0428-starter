const projectsURL = "./data/projectsData.json";
const cardPlaceholder = "../images/card_placeholdr_bg.webp";
const spotlightPlaceholder = "../images/spotlight_placeholde_bg.webp";

let projects = [];
let byId = new Map();
let selectedId = null;

document.addEventListener("DOMContentLoaded", init);

async function loadAboutMe() {
  try {
    const response = await fetch("./data/aboutMeData.json");
    const data = await response.json();

    const aboutMeDiv = document.getElementbyId("aboutMe");
    const p = document.getElement("p");
    p.textContent = data.aboutMe;

    const headshotContainer = document.createElement("div");
    headshotContainer.classList.add("headshotContainer");

    const img = document.createElement("img");
    img.src = data.headshot || "../images/card_paceholde_bg.webp";
    img.alt = "Headshot photo";

    headshotContainer.appendChild(img);

    aboutMeDiv.append(p, headshotContainer);
  } catch (err) {
    console.error("Error loading About Me:", err);
  }
}
