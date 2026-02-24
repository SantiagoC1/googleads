// =====================
// CONFIGURACIÓN
// =====================
console.log("script.js cargó ✅");
const FALLBACK_NUMBER = "5491100000000";

const BASE_MESSAGE_TEMPLATE =
  "Hola, necesito asistencia e información para registro, acceso y soporte. ¿Me ayudan?";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9bsTOs6nCbKAd0ROAK_8DXhqYFvr_lbG4HGDj-C7A_yhXc0qntOgVqSX4HuoIjkrytENkee-2Iec7/pub?gid=0&single=true&output=csv";

// 👇 Pegá acá la URL del Web App de Apps Script (termina en /exec)
const TRACK_URL = "https://script.google.com/macros/s/AKfycbzoJbDp9FXsTR9LOmcj6XD9-ZAEAa9cVBv3yd-aQ9Tw_5W_DF7MpVBTSESR1BL5RCY0CQ/exec";

// =====================
// DOM
// =====================
const btn = document.getElementById("cta-button");
const btnText = document.getElementById("btn-text");

// =====================
// HELPERS
// =====================
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "direct",
    utm_medium: p.get("utm_medium") || "none",
    utm_campaign: p.get("utm_campaign") || "none",
    utm_term: p.get("utm_term") || "",
    utm_content: p.get("utm_content") || "",
    click_id: p.get("click_id") || "",
    zoneid: p.get("zoneid") || "",
  };
}

function normalizePhone(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function deviceLabel() {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return isMobile ? "Mobile" : "Desktop";
}

function buildMessage() {
  const { click_id } = getParams();
  return BASE_MESSAGE_TEMPLATE.replace("{click_id}", click_id || "na");
}

function setButtonLink(numberFromSheet) {
  const clean = normalizePhone(numberFromSheet);
  const finalNumber = clean || FALLBACK_NUMBER;

  const msg = buildMessage();
  const finalUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(msg)}`;

  if (!btn) return;
  btn.href = finalUrl;

  if (btnText) btnText.innerText = "CONTACTAR POR WHATSAPP";
  btn.classList.add("active");
}

// =====================
// TRACKING (JS -> Apps Script -> Google Sheet)
// =====================
function buildUtmString(params) {
  const utm = {
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
    utm_term: params.utm_term,
    utm_content: params.utm_content,
  };
  return JSON.stringify(utm);
}

function track(accion) {
  if (!TRACK_URL || TRACK_URL.includes("PEGAR_URL")) return;

  const params = getParams();
  const payload = {
    accion,
    origen: params.utm_source || "direct",
    dispositivo: deviceLabel(),
    url: location.href,
    ref: document.referrer || "",
    utm: JSON.stringify({
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      utm_term: params.utm_term,
      utm_content: params.utm_content,
    }),
    click_id: params.click_id || "",
    zoneid: params.zoneid || params.utm_content || "",
  };

  const q = new URLSearchParams(payload);
  const img = new Image();
  img.src = `${TRACK_URL}?${q.toString()}`;
}

// =====================
// CARGA DESDE GOOGLE SHEET (CSV) EL NÚMERO
// =====================
async function loadNumberFromSheet() {
  try {
    const url = `${SHEET_URL}&t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo leer el CSV");

    const csv = await res.text();
    const firstLine = csv.split(/\r?\n/)[0] || "";
    const firstCell = firstLine.split(",")[0] || "";

    const phone = normalizePhone(firstCell);
    setButtonLink(phone || FALLBACK_NUMBER);
  } catch (err) {
    console.warn("Fallo al leer Google Sheet, usando fallback:", err);
    setButtonLink(FALLBACK_NUMBER);
  }
}

// =====================
// CLICK HANDLER
// =====================
if (btn) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    // Track del click ANTES de redirigir
    track("click_whatsapp");

    const url = btn.href;

    // GA4 opcional
    const utm = getParams();
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
    }, 250);
  });
}

// =====================
// INICIO
// =====================
setButtonLink(FALLBACK_NUMBER);
loadNumberFromSheet();

if (!sessionStorage.getItem("pv_sent")) {
  track("page_view");
  sessionStorage.setItem("pv_sent", "1");
}

