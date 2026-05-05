const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const CONFIG_TABLE = "mat_live_config";
const COMMANDS_TABLE = "mat_commands";
const CONFIG_ID = 1;

const fallbackConfig = {
  dailyObjective: "In attesa dell'obiettivo del giorno",
  instagramFollowers: 0,
  telegramUsers: 0,
  tiktokFollowers: 0,
  youtubeStatus: "non ancora attivo",
  solanaWallet: "5sc1W9g5VVyBW9EhU5oYhhDF49K751mKjZWo92iemTji",
  minimumDonation: "0.01 SOL",
  socialLinks: {
    instagram: "https://www.instagram.com/clochard_coin?igsh=ZGxnbGV1aWs3OGpr",
    telegram: "https://t.me/+2WX7IXU1CzBlNzc0",
    tiktok: "#",
    terminal: "https://terminal.clochardcoin.it",
    live: "https://live.clochardcoin.it"
  },
  logs: {
    "06": "",
    "09": "",
    "12": "",
    "15": "",
    "18": "",
    "20": ""
  }
};

let config = structuredClone(fallbackConfig);
let audioEnabled = false;
let terminalQueue = Promise.resolve();
let communityInterval = null;
let liveSignalInterval = null;
let configInterval = null;
let lastPrintedLogKey = "";
let lastCommunityCommandId = null;

const $ = (id) => document.getElementById(id);
let el = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  el = {
    dailyObjective: $("dailyObjective"),
    instagramFollowers: $("instagramFollowers"),
    telegramUsers: $("telegramUsers"),
    tiktokFollowers: $("tiktokFollowers"),
    youtubeStatus: $("youtubeStatus"),
    solanaWallet: $("solanaWallet"),
    minimumDonation: $("minimumDonation"),
    instagramLink: $("instagramLink"),
    telegramLink: $("telegramLink"),
    tiktokLink: $("tiktokLink"),
    terminalLink: $("terminalLink"),
    donateBtn: $("donateBtn"),
    copyWalletBtn: $("copyWalletBtn"),
    terminal: $("terminal"),
    ambientAudio: $("ambientAudio"),
    toggleAudioBtn: $("toggleAudioBtn"),
    toast: $("toast"),
    matAvatar: $("matAvatar"),
    matPlaceholder: $("matPlaceholder"),
    archiveList: $("archiveList")
  };

  setupButtons();
  setupMatFallback();
  startLive();
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function startLive() {
  if (el.terminal) el.terminal.innerHTML = "";

  typeLine(nowLabel(), "BOOT", "CLOCHARDCOIN LIVE TERMINAL ONLINE.");
  typeLine(nowLabel(), "SIGNAL", "Segnale h24 attivo. Mat resta in ascolto.");

  await loadConfigFromSupabase();
  applyConfig();
  printScheduledLog();

  clearInterval(configInterval);
  clearInterval(liveSignalInterval);
  clearInterval(communityInterval);

  configInterval = setInterval(async () => {
    await loadConfigFromSupabase();
    applyConfig();
    printScheduledLog();
  }, 10000);

  liveSignalInterval = setInterval(() => {
    const signals = [
      "Segnale h24 stabile.",
      "Mat monitora la strada digitale.",
      "Terminale vivo. In attesa del prossimo log programmato.",
      "Connessione community attiva.",
      "ClochardCoin live pulse confermato."
    ];

    const msg = signals[Math.floor(Math.random() * signals.length)];
    typeLine(nowLabel(), "LIVE", msg);
  }, 60000);

  communityInterval = setInterval(printCommunitySignal, 15000);

  printCommunitySignal();
}

async function loadConfigFromSupabase() {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}` +
      `?select=*` +
      `&id=eq.${CONFIG_ID}` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const rows = await response.json();
    const data = rows[0];

    if (!data) return;

    config = {
      ...structuredClone(fallbackConfig),
      dailyObjective: data.daily_objective || fallbackConfig.dailyObjective,
      instagramFollowers: data.instagram_followers ?? 0,
      telegramUsers: data.telegram_followers ?? 0,
      tiktokFollowers: data.tiktok_followers ?? 0,
      logs: data.scheduled_logs || fallbackConfig.logs
    };
  } catch (error) {
    console.warn("Errore config Supabase:", error);
  }
}

function applyConfig() {
  setText(el.dailyObjective, config.dailyObjective);
  setText(el.instagramFollowers, config.instagramFollowers);
  setText(el.telegramUsers, config.telegramUsers);
  setText(el.tiktokFollowers, config.tiktokFollowers);
  setText(el.youtubeStatus, config.youtubeStatus);
  setText(el.solanaWallet, config.solanaWallet);
  setText(el.minimumDonation, config.minimumDonation);

  setHref(el.instagramLink, config.socialLinks.instagram);
  setHref(el.telegramLink, config.socialLinks.telegram);
  setHref(el.tiktokLink, config.socialLinks.tiktok);
  setHref(el.terminalLink, config.socialLinks.terminal);

  if (el.donateBtn) {
    el.donateBtn.textContent = `Dona ${config.minimumDonation}`;
  }

  renderArchivePlaceholder();
}

function getCurrentLogHour() {
  const hour = new Date().getHours();

  if (hour >= 20) return "20";
  if (hour >= 18) return "18";
  if (hour >= 15) return "15";
  if (hour >= 12) return "12";
  if (hour >= 9) return "09";
  if (hour >= 6) return "06";

  return null;
}

function getLogCategory(hour) {
  const categories = {
    "06": "BOOT",
    "09": "USER_SIGNAL",
    "12": "SCAN",
    "15": "RESULT",
    "18": "MAT",
    "20": "REPORT"
  };

  return categories[hour] || "MAT";
}

function printScheduledLog() {
  const hour = getCurrentLogHour();
  if (!hour) return;

  const text = clean(config.logs?.[hour]);
  if (!text) return;

  const today = new Date().toISOString().slice(0, 10);
  const logKey = `${today}-${hour}-${text}`;

  if (logKey === lastPrintedLogKey) return;

  lastPrintedLogKey = logKey;

  typeLine(`${hour}:00`, getLogCategory(hour), text);
}

async function fetchCommunityCommands() {
  try {
    const query =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,created_at,status` +
      `&status=eq.approved` +
      `&order=created_at.desc` +
      `&limit=5`;

    const response = await fetch(query, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  } catch (error) {
    console.warn("Errore comandi community:", error);
    return [];
  }
}

async function printCommunitySignal() {
  const commands = await fetchCommunityCommands();
  if (!commands.length) return;

  const fresh = commands.filter((item) => item.id !== lastCommunityCommandId);
  const pool = fresh.length ? fresh : commands;
  const item = pool[Math.floor(Math.random() * pool.length)];

  if (!item || !clean(item.command)) return;

  lastCommunityCommandId = item.id;

  const nickname = clean(item.nickname) || "utente_anonimo";

  typeLine(nowLabel(), "USER_SIGNAL", `@${nickname}: ${item.command}`);
  typeLine(nowLabel(), "MAT", "Comando approvato ricevuto. Segnale integrato nella live.");
}

function renderArchivePlaceholder() {
  if (!el.archiveList) return;

  el.archiveList.innerHTML = `
    <div class="archive-empty">
      Archivio giornaliero in preparazione. I log attivi ora arrivano dal pannello moderatore.
    </div>
  `;
}

function typeLine(label, category, text) {
  terminalQueue = terminalQueue.then(() => typeLineInternal(label, category, text));
  return terminalQueue;
}

async function typeLineInternal(label, category, text) {
  if (!el.terminal || !clean(text)) return;

  const line = document.createElement("p");
  line.className = "terminal-line cursor";

  if (category === "REPORT" || category === "ERROR") {
    line.classList.add("alert");
  }

  el.terminal.appendChild(line);

  const full = `[${label}] [${category}] ${text}`;

  for (let i = 0; i <= full.length; i++) {
    line.innerHTML = formatLine(full.slice(0, i));
    el.terminal.scrollTop = el.terminal.scrollHeight;
    await sleep(14 + Math.random() * 20);
  }

  line.classList.remove("cursor");
}

function formatLine(text) {
  const match = text.match(/^(\[[^\]]+\])\s(\[[^\]]+\])\s?(.*)$/);

  if (!match) return escapeHtml(text);

  return `
    <span class="time">${escapeHtml(match[1])}</span>
    <span class="category">${escapeHtml(match[2])}</span>
    ${escapeHtml(match[3])}
  `;
}

function nowLabel() {
  return new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function clean(value) {
  return String(value || "").trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  if (!el.toast) return;

  el.toast.textContent = message;
  el.toast.classList.add("show");

  setTimeout(() => {
    el.toast.classList.remove("show");
  }, 2600);
}

function setupButtons() {
  if (el.copyWalletBtn) {
    el.copyWalletBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(config.solanaWallet);
        showToast("Wallet copiato.");
      } catch {
        showToast("Copia non riuscita. Tieni premuto sul wallet.");
      }
    });
  }

  if (el.donateBtn) {
    el.donateBtn.addEventListener("click", () => {
      const amount = String(config.minimumDonation || "0.01 SOL").replace(" SOL", "");
      const label = encodeURIComponent("Supporta Mat Clochard");
      const solanaPayUrl = `solana:${config.solanaWallet}?amount=${amount}&label=${label}`;

      window.location.href = solanaPayUrl;

      setTimeout(() => {
        showToast("Se il wallet non si apre, copia il wallet e invia manualmente.");
      }, 800);
    });
  }

  if (el.toggleAudioBtn && el.ambientAudio) {
    el.toggleAudioBtn.addEventListener("click", async () => {
      if (!audioEnabled) {
        try {
          el.ambientAudio.volume = 0.22;
          await el.ambientAudio.play();

          audioEnabled = true;
          el.toggleAudioBtn.textContent = "Disattiva musica ambient";
          showToast("Musica ambient attivata.");
        } catch {
          showToast("Audio non disponibile. Carica assets/ambient.mp3.");
        }

        return;
      }

      el.ambientAudio.pause();
      audioEnabled = false;
      el.toggleAudioBtn.textContent = "Attiva musica ambient";
      showToast("Musica ambient disattivata.");
    });
  }
}

function setupMatFallback() {
  if (!el.matAvatar || !el.matPlaceholder) return;

  el.matAvatar.addEventListener("error", () => {
    el.matAvatar.style.display = "none";
    el.matPlaceholder.style.display = "grid";
  });
}

function setText(node, value) {
  if (!node) return;
  node.textContent = value;
}

function setHref(node, value) {
  if (!node) return;
  node.href = value || "#";
}