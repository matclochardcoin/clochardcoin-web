const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const COMMANDS_TABLE = "mat_commands";
const CONFIG_TABLE = "mat_live_config";
const ARCHIVE_TABLE = "mat_live_archive";
const CONFIG_ID = 1;
const ADMIN_PASSWORD = "MAT2026";

const $ = (id) => document.getElementById(id);

const loginBox = $("loginBox");
const moderationBox = $("moderationBox");
const adminPassword = $("adminPassword");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const refreshBtn = $("refreshBtn");
const saveLiveConfigBtn = $("saveLiveConfigBtn");
const saveArchiveBtn = $("saveArchiveBtn");
const moderationList = $("moderationList");
const toast = $("toast");

const matStatus = $("matStatus");
const matEnergy = $("matEnergy");
const liveDate = $("liveDate");
const dailyObjective = $("dailyObjective");

const instagramFollowers = $("instagramFollowers");
const telegramFollowers = $("telegramFollowers");
const tiktokFollowers = $("tiktokFollowers");
const youtubeStatus = $("youtubeStatus");

const solanaWallet = $("solanaWallet");
const minimumDonation = $("minimumDonation");

const instagramLink = $("instagramLink");
const telegramLink = $("telegramLink");
const tiktokLink = $("tiktokLink");
const terminalLink = $("terminalLink");
const liveLink = $("liveLink");

const log06 = $("log06");
const log09 = $("log09");
const log12 = $("log12");
const log15 = $("log15");
const log18 = $("log18");
const log20 = $("log20");

function supabaseHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra
  };
}

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getSelectedLiveDate() {
  return liveDate.value || todayIsoDate();
}

function numberValue(input, fallback = 0) {
  const value = Number(input?.value || fallback);
  return Number.isNaN(value) ? fallback : value;
}

function textValue(input, fallback = "") {
  return String(input?.value || fallback).trim();
}

function getScheduledLogsPayload() {
  return {
    "06": textValue(log06),
    "09": textValue(log09),
    "12": textValue(log12),
    "15": textValue(log15),
    "18": textValue(log18),
    "20": textValue(log20)
  };
}

function showLogin() {
  loginBox.classList.remove("hidden");
  moderationBox.classList.add("hidden");
}

function showModerator() {
  loginBox.classList.add("hidden");
  moderationBox.classList.remove("hidden");
  loadLiveConfig();
  loadCommands();
}

async function loadLiveConfig() {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}` +
      `?select=*` +
      `&id=eq.${CONFIG_ID}` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: supabaseHeaders()
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const config = data[0];

    if (!config) {
      liveDate.value = todayIsoDate();
      matStatus.value = "ONLINE";
      matEnergy.value = 21;
      showToast("Config non trovata. Verrà creata al primo salvataggio.");
      return;
    }

    matStatus.value = config.mat_status || "ONLINE";
    matEnergy.value = config.mat_energy ?? 21;
    liveDate.value = config.live_date || todayIsoDate();
    dailyObjective.value = config.daily_objective || "";

    instagramFollowers.value = config.instagram_followers ?? "";
    telegramFollowers.value = config.telegram_followers ?? "";
    tiktokFollowers.value = config.tiktok_followers ?? "";
    youtubeStatus.value = config.youtube_status || "A BREVE";

    solanaWallet.value = config.solana_wallet || "5sc1W9g5VVyBW9EhU5oYhhDF49K751mKjZWo92iemTji";
    minimumDonation.value = config.minimum_donation || "0.01 SOL";

    instagramLink.value = config.instagram_link || "https://www.instagram.com/clochard_coin?igsh=ZGxnbGV1aWs3OGpr";
    telegramLink.value = config.telegram_link || "https://t.me/+2WX7IXU1CzBlNzc0";
    tiktokLink.value = config.tiktok_link || "https://www.tiktok.com/@matt.clochard?_r=1&_t=ZN-9679EEU85TT";
    terminalLink.value = config.terminal_link || "https://terminal.clochardcoin.it";
    liveLink.value = config.live_link || "https://live.clochardcoin.it";

    const logs = config.scheduled_logs || {};

    log06.value = getLogText(logs["06"]);
    log09.value = getLogText(logs["09"]);
    log12.value = getLogText(logs["12"]);
    log15.value = getLogText(logs["15"]);
    log18.value = getLogText(logs["18"]);
    log20.value = getLogText(logs["20"]);
  } catch (error) {
    console.error(error);
    showToast("Errore caricamento cervello live.");
  }
}

function getLogText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.text || "";
  return "";
}

async function saveLiveConfig() {
  const selectedDate = getSelectedLiveDate();

  const payload = {
    id: CONFIG_ID,
    live_date: selectedDate,
    daily_objective: textValue(dailyObjective),
    mat_status: textValue(matStatus, "ONLINE"),
    mat_energy: Math.max(0, Math.min(100, numberValue(matEnergy, 21))),
    instagram_followers: numberValue(instagramFollowers),
    telegram_followers: numberValue(telegramFollowers),
    tiktok_followers: numberValue(tiktokFollowers),
    youtube_status: textValue(youtubeStatus, "A BREVE"),
    solana_wallet: textValue(solanaWallet),
    minimum_donation: textValue(minimumDonation, "0.01 SOL"),
    instagram_link: textValue(instagramLink),
    telegram_link: textValue(telegramLink),
    tiktok_link: textValue(tiktokLink),
    terminal_link: textValue(terminalLink),
    live_link: textValue(liveLink),
    scheduled_logs: getScheduledLogsPayload(),
    signal_status: "LIVE",
    updated_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}`, {
      method: "POST",
      headers: supabaseHeaders({
        Prefer: "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());

    showToast(`Cervello live salvato per il ${selectedDate}.`);
  } catch (error) {
    console.error(error);
    showToast("Errore salvataggio. Controlla colonne e policy Supabase.");
  }
}

async function saveArchive() {
  const selectedDate = getSelectedLiveDate();

  const payload = {
    archive_date: selectedDate,
    live_date: selectedDate,
    daily_objective: textValue(dailyObjective),
    instagram_followers: numberValue(instagramFollowers),
    telegram_followers: numberValue(telegramFollowers),
    tiktok_followers: numberValue(tiktokFollowers),
    scheduled_logs: getScheduledLogsPayload()
  };

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}?on_conflict=archive_date`,
      {
        method: "POST",
        headers: supabaseHeaders({
          Prefer: "resolution=merge-duplicates,return=minimal"
        }),
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error(await response.text());

    showToast(`Giornata ${selectedDate} salvata nella memoria.`);
  } catch (error) {
    console.error(error);
    showToast("Errore archivio. Controlla mat_live_archive.");
  }
}

async function loadCommands() {
  moderationList.innerHTML = `
    <div class="command-item">
      <strong>Caricamento...</strong>
      <p>Sto leggendo le missioni pending.</p>
    </div>
  `;

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,status,created_at` +
      `&status=eq.pending` +
      `&order=created_at.desc` +
      `&limit=50`;

    const response = await fetch(url, {
      headers: supabaseHeaders()
    });

    if (!response.ok) throw new Error(await response.text());

    const commands = await response.json();
    renderCommands(commands);
  } catch (error) {
    console.error(error);

    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Errore lettura Supabase</strong>
        <p>Controlla le policy SELECT/UPDATE sulla tabella mat_commands.</p>
      </div>
    `;
  }
}

function renderCommands(commands) {
  moderationList.innerHTML = "";

  if (!commands.length) {
    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Nessuna missione pending</strong>
        <p>Quando gli utenti inviano nuovi comandi, appariranno qui.</p>
      </div>
    `;
    return;
  }

  commands.forEach((item) => {
    const div = document.createElement("div");
    div.className = "command-item";

    div.innerHTML = `
      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
      <p>${escapeHtml(item.command)}</p>
      <small>${escapeHtml(item.created_at)} · stato: ${escapeHtml(item.status)}</small>

      <div class="actions" style="justify-content:flex-start;margin:12px 0 0;">
        <button type="button" data-action="approved" data-id="${escapeHtml(item.id)}">Approva missione</button>
        <button type="button" data-action="rejected" data-id="${escapeHtml(item.id)}">Rifiuta</button>
      </div>
    `;

    moderationList.appendChild(div);
  });
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({
          Prefer: "return=minimal"
        }),
        body: JSON.stringify({ status })
      }
    );

    if (!response.ok) throw new Error(await response.text());

    showToast(status === "approved" ? "Missione approvata." : "Missione rifiutata.");
    loadCommands();
  } catch (error) {
    console.error(error);
    showToast("Errore aggiornamento missione.");
  }
}

loginBtn.addEventListener("click", () => {
  const password = adminPassword.value.trim();

  if (password !== ADMIN_PASSWORD) {
    showToast("Password errata.");
    return;
  }

  localStorage.setItem("mat-moderator-auth", "true");
  showToast("Accesso riuscito.");
  showModerator();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("mat-moderator-auth");
  showLogin();
});

refreshBtn.addEventListener("click", loadCommands);
saveLiveConfigBtn.addEventListener("click", saveLiveConfig);
saveArchiveBtn.addEventListener("click", saveArchive);

moderationList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  updateStatus(button.dataset.id, button.dataset.action);
});

if (localStorage.getItem("mat-moderator-auth") === "true") {
  showModerator();
} else {
  showLogin();
}