"use strict";

const MAIL_PRIMARY = "riolering@tutamail.com";
const MAIL_CC = "n.vanderhoek2@student.avans.nl";

// Verstuurt een bericht rechtstreeks (zonder mailprogramma) via FormSubmit
async function sendMail(subject, data) {
  const res = await fetch("https://formsubmit.co/ajax/" + MAIL_PRIMARY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(Object.assign({ _subject: subject, _cc: MAIL_CC, _template: "table" }, data))
  });
  const json = await res.json();
  if (!res.ok || json.success === false || json.success === "false") throw new Error("send failed");
}

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
if (document.getElementById("diagram")) drawDiagram("laag");

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
if (form) form.addEventListener("submit", e => {
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
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  status.textContent = "Bezig met versturen...";
  sendMail("Offerteaanvraag " + d.get("type") + " - " + d.get("naam"), {
    naam: d.get("naam"), email: d.get("email"), type: d.get("type"),
    bericht: d.get("bericht"), _replyto: d.get("email")
  }).then(() => {
    status.textContent = "Bedankt, je aanvraag is verstuurd.";
    form.reset();
  }).catch(() => {
    status.textContent = "Versturen is niet gelukt. Probeer het later opnieuw of mail naar " + MAIL_PRIMARY + ".";
  }).finally(() => { btn.disabled = false; });
});

document.getElementById("year").textContent = new Date().getFullYear();

 // Urendeclaratie (bewaard in deze browser)

const HOURS_KEY = "riolering-uren";

const hoursForm = document.getElementById("hours-form");

const hoursStatus = document.getElementById("hours-status");

const hoursBody = document.querySelector("#hours-table tbody");

let hours = [];

try { hours = JSON.parse(localStorage.getItem(HOURS_KEY)) || []; } catch (e) { hours = []; }


function saveHours() {

  try { localStorage.setItem(HOURS_KEY, JSON.stringify(hours)); } catch (e) {}

}


function renderHours() {

  hoursBody.innerHTML = "";

  hours.forEach((r, i) => {

    const tr = document.createElement("tr");

    [r.datum, r.naam, r.soort, String(r.uren)].forEach(v => {

      const td = document.createElement("td");

      td.textContent = v;

      tr.appendChild(td);

    });

    const td = document.createElement("td");

    const b = document.createElement("button");

    b.className = "del"; b.type = "button"; b.textContent = "Verwijder";

    b.addEventListener("click", () => { hours.splice(i, 1); saveHours(); renderHours(); });

    td.appendChild(b); tr.appendChild(td);

    hoursBody.appendChild(tr);

  });

  const total = hours.reduce((s, r) => s + r.uren, 0);

  document.getElementById("hours-total").textContent = total.toFixed(2).replace(/\.?0+$/, "");

  document.getElementById("hours-empty").hidden = hours.length > 0;

}


if (hoursForm) hoursForm.addEventListener("submit", e => {

  e.preventDefault();

  let ok = true;

  hoursForm.querySelectorAll("[required]").forEach(f => {

    const valid = f.value !== "" && f.checkValidity();

    f.classList.toggle("invalid", !valid);

    if (!valid) ok = false;

  });

  if (!ok) { hoursStatus.textContent = "Kies een naam, datum en een aantal uren tussen 0,25 en 1100."; return; }

  const d = new FormData(hoursForm);

  const soort = d.get("toelichting").trim() ? d.get("soort") + " (" + d.get("toelichting").trim() + ")" : d.get("soort");

  hours.push({ naam: d.get("naam"), datum: d.get("datum"), uren: parseFloat(d.get("uren")), soort });

  saveHours(); renderHours();

  hoursForm.reset();

  hoursStatus.textContent = "Declaratie toegevoegd.";

});


document.getElementById("hours-send")?.addEventListener("click", () => {

  if (!hours.length) { hoursStatus.textContent = "Voeg eerst uren toe."; return; }

  const btn = document.getElementById("hours-send");

  const total = hours.reduce((s, r) => s + r.uren, 0);

  const lines = hours.map(r => r.datum + " | " + r.naam + " | " + r.soort + " | " + r.uren + " uur");

  btn.disabled = true;

  hoursStatus.textContent = "Bezig met versturen...";

  sendMail("Urendeclaratie", { declaraties: lines.join("\n"), totaal: total + " uur" })

    .then(() => {

      hoursStatus.textContent = "Declaraties verstuurd.";

      hours = []; saveHours(); renderHours();

    })

    .catch(() => {

      hoursStatus.textContent = "Versturen is niet gelukt. Je uren zijn bewaard; download ze als CSV of probeer het later opnieuw.";

    })

    .finally(() => { btn.disabled = false; });

});


document.getElementById("hours-csv")?.addEventListener("click", () => {

  if (!hours.length) { hoursStatus.textContent = "Voeg eerst uren toe."; return; }

  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';

  const csv = ["datum,naam,werkzaamheden,uren"].concat(hours.map(r => [r.datum, r.naam, r.soort, r.uren].map(esc).join(","))).join("\n");

  const a = document.createElement("a");

  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));

  a.download = "urendeclaratie.csv";

  a.click();

  URL.revokeObjectURL(a.href);

});


if (hoursForm) renderHours(); 
