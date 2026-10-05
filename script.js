"use strict";

const NS = "http://www.w3.org/2000/svg";
const types = {
  laag: { floors: 3, caption: "Laagbouw: korte stam, grondleiding met afschot naar het openbaar riool." },
  hoog: { floors: 10, caption: "Hoogbouw: lange afvoerstam met ontluchting boven dak en aansluiting per verdieping." }
};

function el(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(node);
  return node;
}

function drawDiagram(type) {
  const svg = document.getElementById("diagram");
  const { floors, caption } = types[type];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  svg.innerHTML = "";

  const groundY = 360, topY = 70, stackX = 230;
  const h = (groundY - topY) / floors;

  // Floors
  for (let i = 0; i < floors; i++) {
    const y = groundY - (i + 1) * h;
    el("rect", { class: "floor", x: 40, y, width: 220, height: h }, svg);
  }

  // Ground line
  el("line", { class: "ground", x1: 10, y1: groundY, x2: 390, y2: groundY }, svg);

  // Stack: vent above roof, down to ground, then sloped drain to sewer
  el("path", { class: "pipe", d: `M${stackX} 30 V${groundY + 25} L370 ${groundY + 38}` }, svg);

  // Fixtures and branches per floor
  for (let i = 0; i < floors; i++) {
    const y = groundY - i * h - h / 2;
    el("line", { class: "pipe", x1: 80, y1: y, x2: stackX, y2: y, "stroke-width": 4 }, svg);
    el("rect", { class: "fixture", x: 60, y: y - 8, width: 16, height: 16, rx: 3 }, svg);
  }

  // Labels
  const t1 = el("text", { class: "label", x: 270, y: 24 }, svg); t1.textContent = "Ontluchting";
  const t2 = el("text", { class: "label", x: 262, y: groundY + 62 }, svg); t2.textContent = "Naar openbaar riool";

  // Flowing drops
  if (!reduceMotion) {
    const dur = 1.2 + floors * 0.22;
    for (let d = 0; d < 4; d++) {
      const c = el("circle", { class: "drop", r: 5, cx: stackX, cy: topY }, svg);
      const a = el("animate", {
        attributeName: "cy", from: topY, to: groundY + 22,
        dur: dur + "s", begin: (d * dur / 4) + "s", repeatCount: "indefinite"
      }, c);
    }
  }

  document.getElementById("diagram-caption").textContent = caption;
}

// Switch laagbouw / hoogbouw
document.querySelectorAll(".switch button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".switch button").forEach(b => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active);
    });
    drawDiagram(btn.dataset.type);
  });
});
drawDiagram("laag");

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
}));

// Contact form: validates, then opens the visitor's mail app
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");
form.addEventListener("submit", e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll("[required]").forEach(f => {
    const valid = f.value.trim() !== "" && f.checkValidity();
    f.classList.toggle("invalid", !valid);
    if (!valid) ok = false;
  });
  if (!ok) {
    status.textContent = "Vul alle velden in en controleer je e-mailadres.";
    return;
  }
  const d = new FormData(form);
  const subject = encodeURIComponent("Aanvraag " + d.get("type") + " - " + d.get("naam"));
  const body = encodeURIComponent(d.get("bericht") + "\n\n" + d.get("naam") + " (" + d.get("email") + ")");
  status.textContent = "Je mailprogramma wordt geopend.";
  window.location.href = "mailto:info@riolering.eu.org?subject=" + subject + "&body=" + body;
});

document.getElementById("year").textContent = new Date().getFullYear();
