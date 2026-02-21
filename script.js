// =====================
// CONFIGURACIÓN
// =====================

const FALLBACK_NUMBER = "5491100000000";

const BASE_MESSAGE =
  "Hola, necesito asistencia e información para registro, acceso y soporte. ¿Me ayudan?";

// CSV público (Google Sheets publicado)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bsTOs6nCbKAd0ROAK_8DXhqYFvr_lbG4HGDj-C7A_yhXc0qntOgVqSX4HuoIjkrytENkee-2Iec7/pub?gid=0&single=true&output=csv";

// =====================
// DOM
// =====================
const btn = document.getElementById("cta-button");
const btnText = document.getElementById("btn-text");

// =====================
// HELPERS
// =====================
function getUtmData() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get("utm_source") || "direct",
    utm_medium: urlParams.get("utm_medium") || "none",
    utm_campaign: urlParams.get("utm_campaign") || "none",
    utm_term: urlParams.get("utm_term") || "",
    utm_content: urlParams.get("utm_content") || "",
  };
}

function normalizePhone(raw) {
  // deja solo números
  return String(raw || "").replace(/\D/g, "");
}

function setButtonLink(numberFromSheet) {
  const clean = normalizePhone(numberFromSheet);
  const finalNumber = clean || FALLBACK_NUMBER;

  const finalUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(
    BASE_MESSAGE
  )}`;

  if (!btn) return;
  btn.href = finalUrl;

  if (btnText) btnText.innerText = "CONTACTAR POR WHATSAPP";
  btn.classList.add("active");
}

// =====================
// CARGA DESDE GOOGLE SHEET (CSV)
// =====================
async function loadNumberFromSheet() {
  try {
    // Evita cache
    const url = `${SHEET_URL}&t=${Date.now()}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo leer el CSV");

    const csv = await res.text();

    // Tomamos la primera “celda” del CSV (fila 1 col 1)
    // (sirve si tu sheet tiene el número en A1)
    const firstLine = csv.split(/\r?\n/)[0] || "";
    const firstCell = firstLine.split(",")[0] || "";

    const phone = normalizePhone(firstCell);

    // Si no vino número válido, fallback
    setButtonLink(phone || FALLBACK_NUMBER);
  } catch (err) {
    console.warn("Fallo al leer Google Sheet, usando fallback:", err);
    setButtonLink(FALLBACK_NUMBER);
  }
}

// =====================
// CLICK HANDLER (GA4 opcional)
// =====================
if (btn) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const url = btn.href;
    const utm = getUtmData();

    if (typeof gtag === "function") {
      gtag("event", "click_whatsapp", {
        link_url: url,
        event_category: "lead",
        event_label: "cta_whatsapp",
        ...utm,
      });
    }

    setTimeout(() => {
      window.location.href = url;
    }, 350);
  });
}

// =====================
// INICIO
// =====================
// Seteamos algo rápido por si el fetch tarda
setButtonLink(FALLBACK_NUMBER);
// Luego lo reemplazamos con el número del Sheet
loadNumberFromSheet();
