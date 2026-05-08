const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const COMMANDS_TABLE = "mat_commands";

const commandForm = document.getElementById("commandForm");
const nicknameInput = document.getElementById("nickname");
const missionTypeInput = document.getElementById("missionType");
const commandInput = document.getElementById("command");
const rulesAccepted = document.getElementById("rulesAccepted");
const submitBtn = document.getElementById("submitBtn");
const successBox = document.getElementById("successBox");
const commandsList = document.getElementById("commandsList");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const charCount = document.getElementById("charCount");
const toast = document.getElementById("toast");
const pendingCount = document.getElementById("pendingCount");

const LOCAL_KEY = "mat-local-missions";

const missionLabels = {
  news: "Verifica notizia",
  token: "Verifica token"
};

document.addEventListener("DOMContentLoaded", () => {
  renderLocalCommands();
  updateCharCount();
  updatePlaceholder();
  loadPendingCount();
});

function showToast(message) {
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function headers(extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra
  };
}

function clean(value) {
  return String(value || "").trim();
}

function sanitizeNickname(value) {
  const raw = clean(value) || "utente_anonimo";

  return raw
    .replace(/[^a-zA-Z0-9_./-]/g, "_")
    .slice(0, 24);
}

function getMissionType() {
  const value = clean(missionTypeInput?.value || "news");
  return value === "token" ? "token" : "news";
}

function getMissionLabel(type) {
  return missionLabels[type] || missionLabels.news;
}

function getLocalCommands() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalCommand(item) {
  const commands = getLocalCommands();

  commands.unshift(item);

  localStorage.setItem(LOCAL_KEY, JSON.stringify(commands.slice(0, 10)));
  renderLocalCommands();
}

function renderLocalCommands() {
  if (!commandsList) return;

  const commands = getLocalCommands();

  if (!commands.length) {
    commandsList.innerHTML = `
      <div class="command-item">
        <strong>Nessun comando locale</strong>
        <p>I comandi inviati da questo dispositivo appariranno qui.</p>
      </div>
    `;
    return;
  }

  commandsList.innerHTML = "";

  commands.forEach((item) => {
    const missionType = item.mission_type || "news";

    const div = document.createElement("div");
    div.className = "command-item";

    div.innerHTML = `
      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
      <p><b>${escapeHtml(getMissionLabel(missionType))}</b></p>
      <p>${escapeHtml(item.command)}</p>
      <small>${escapeHtml(item.created_at)} · stato: pending moderation</small>
    `;

    commandsList.appendChild(div);
  });
}

async function loadPendingCount() {
  if (!pendingCount) return;

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id` +
      `&status=eq.pending`;

    const response = await fetch(url, {
      headers: headers({
        Prefer: "count=exact"
      }),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    const contentRange = response.headers.get("content-range");
    const total = contentRange ? contentRange.split("/")[1] : null;

    pendingCount.textContent = total && total !== "*" ? total : "...";
  } catch (error) {
    console.warn("Errore conteggio comandi:", error);
    pendingCount.textContent = "?";
  }
}

function validateMission(command, missionType) {
  if (command.length < 12) {
    return "Scrivi un comando più chiaro.";
  }

  const blockedWords = [
    "password",
    "seed phrase",
    "private key",
    "chiave privata",
    "minaccia",
    "uccidi",
    "droga"
  ];

  const lower = command.toLowerCase();

  if (blockedWords.some((word) => lower.includes(word))) {
    return "Il comando contiene parole non ammesse.";
  }

  if (missionType === "token") {

  const hasContractAddress =
    /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(command);

  const hasTokenKeywords =
    lower.includes("token") ||
    lower.includes("contract") ||
    lower.includes("ca:") ||
    lower.includes("mint") ||
    lower.includes("pump.fun") ||
    lower.includes("dexscreener") ||
    lower.includes("birdeye") ||
    lower.includes("solscan") ||
    lower.includes("address") ||
    lower.includes("indirizzo");

  const hasUrl =
    lower.includes("https://") ||
    lower.includes("http://");

  const looksLikeTokenRequest =
    hasContractAddress ||
    hasTokenKeywords ||
    hasUrl;

  if (!looksLikeTokenRequest) {
    return "Inserisci un contract address o un link valido.";
  }
}

  if (missionType === "news") {
    const looksLikeNewsRequest =
      lower.includes("notizia") ||
      lower.includes("verifica") ||
      lower.includes("fonte") ||
      lower.includes("link") ||
      lower.includes("articolo") ||
      lower.includes("è vero") ||
      lower.includes("e vero") ||
      lower.includes("fake") ||
      lower.includes("bufala") ||
      lower.includes("https://") ||
      lower.includes("http://");

    if (!looksLikeNewsRequest) {
      return "Per verificare una notizia inserisci testo, link o contesto da controllare.";
    }
  }

  return "";
}

function buildCommandForMat(command, missionType) {
  if (missionType === "token") {
    return `VERIFICA TOKEN: ${command}`;
  }

  return `VERIFICA NOTIZIA: ${command}`;
}

async function sendCommand(event) {
  event.preventDefault();

  const nickname = sanitizeNickname(nicknameInput.value);
  const missionType = getMissionType();
  const command = clean(commandInput.value);
  const commandForMat = buildCommandForMat(command, missionType);

  if (!command) {
    showToast("Scrivi un comando per Mat.");
    return;
  }

  const validationError = validateMission(command, missionType);

  if (validationError) {
    showToast(validationError);
    return;
  }

  if (!rulesAccepted.checked) {
    showToast("Devi accettare le regole.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Invio comando...";

  try {
    const payload = {
      nickname,
      mission_type: missionType,
      command: commandForMat,
      status: "pending"
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}`, {
      method: "POST",
      headers: headers({
        Prefer: "return=minimal"
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());

    saveLocalCommand({
      nickname,
      mission_type: missionType,
      command: commandForMat,
      created_at: new Date().toLocaleString("it-IT")
    });

    commandForm.reset();
    updateCharCount();
    updatePlaceholder();

    if (successBox) {
      successBox.classList.remove("hidden");

      setTimeout(() => {
        successBox.classList.add("hidden");
      }, 5000);
    }

    showToast("Comando inviato. Attende moderazione.");
    loadPendingCount();
  } catch (error) {
    console.error(error);
    showToast("Errore invio comando. Controlla Supabase.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia comando a Mat";
  }
}

function updateCharCount() {
  if (charCount && commandInput) {
    charCount.textContent = commandInput.value.length;
  }
}

function updatePlaceholder() {
  if (!commandInput) return;

  const missionType = getMissionType();

  if (missionType === "token") {
    commandInput.placeholder =
      "Esempio: Mat, verifica questo token e cerca segnali di rischio: contract address, link Dexscreener, Pump.fun o Solscan.";
    return;
  }

  commandInput.placeholder =
    "Esempio: Mat, verifica questa notizia e dimmi se è affidabile: incolla link, testo o contesto da controllare.";
}

if (commandInput) {
  commandInput.addEventListener("input", updateCharCount);
}

if (missionTypeInput) {
  missionTypeInput.addEventListener("change", updatePlaceholder);
}

if (commandForm) {
  commandForm.addEventListener("submit", sendCommand);
}

if (clearLocalBtn) {
  clearLocalBtn.addEventListener("click", () => {
    localStorage.removeItem(LOCAL_KEY);
    renderLocalCommands();
    showToast("Lista locale cancellata.");
  });
}