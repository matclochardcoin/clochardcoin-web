const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";
const COMMANDS_TABLE = "mat_commands";

const fallbackConfig = {
  date: "",
  dailyObjective: "",
  instagramFollowers: 142,
  telegramUsers: 7,
  tiktokFollowers: 2,
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
  selectedCommands: [],
  logs: {
    "06": { category: "BOOT", text: "" },
    "09": { category: "USER_SIGNAL", text: "" },
    "12": { category: "SCAN", text: "" },
    "15": { category: "RESULT", text: "" },
    "18": { category: "MAT", text: "" },
    "20": { category: "REPORT", text: "" }
  }
};

const logSchedule = [
  { hour: 6, key: "06", label: "06:00" },
  { hour: 9, key: "09", label: "09:00" },
  { hour: 12, key: "12", label: "12:00" },
  { hour: 15, key: "15", label: "15:00" },
  { hour: 18, key: "18", label: "18:00" },
  { hour: 20, key: "20", label: "20:00" }
];

let config = structuredClone(fallbackConfig);
let audioEnabled = false;
let logInterval = null;
let communityInterval = null;
let lastCommunityCommandId = null;
let terminalQueue = Promise.resolve();

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
  loadConfig();
}

async function loadConfig() {
  try {
    const response = await fetch(`./live-config.json?nocache=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Config non disponibile");

    const external = await response.json();
    config = mergeConfig(fallbackConfig, external);
  } catch (error) {
    console.warn("Uso fallback:", error);
    config = structuredClone(fallbackConfig);
  }

  applyConfig();
  startTerminal();
}

function mergeConfig(base, external = {}) {
  return {
    ...structuredClone(base),
    ...external,
    socialLinks: {
      ...base.socialLinks,
      ...(external.socialLinks || {})
    },
    logs: {
      ...base.logs,
      ...(external.logs || {})
    },
    selectedCommands: Array.isArray(external.selectedCommands)
      ? external.selectedCommands
      : []
  };
}

function applyConfig() {
  setText(el.dailyObjective, clean(config.dailyObjective) || "In attesa dell'input serale da Termux");
  setText(el.instagramFollowers, config.instagramFollowers);
  setText(el.telegramUsers, config.telegramUsers);
  setText(el.tiktokFollowers, config.tiktokFollowers);
  setText(el.youtubeStatus, config.youtubeStatus);
  setText(el.solanaWallet, config.solanaWallet);
  setText(el.minimumDonation, config.minimumDonation);

  setHref(el.instagramLink, config.socialLinks.instagram);
  setHref(el.telegramLink, config.socialLinks.telegram);
  setHref(el.tiktokLink, config.socialLinks.tiktok);
  setHref(el.terminalLink, config.socialLinks.terminal || "https://terminal.clochardcoin.it");

  if (el.donateBtn) {
    el.donateBtn.textContent = `Dona ${config.minimumDonation}`;
  }
}

function startTerminal() {
  if (!el.terminal) return;

  el.terminal.innerHTML = "";
  terminalQueue = Promise.resolve();

  clearInterval(logInterval);
  clearInterval(communityInterval);

  const hasMission = clean(config.dailyObjective).length > 0;
  const hasLogs = Object.values(config.logs || {}).some((log) => clean(log?.text).length > 0);

  if (!hasMission && !hasLogs) {
    typeLine(nowLabel(), "STANDBY", "In attesa dell'input serale da Termux.");
  } else {
    printTodayUnlockedLogs();

    setTimeout(() => {
      const next = getNextLog();

      if (next) {
        typeLine(nowLabel(), "WAIT", `Prossimo log programmato: ${next.label}.`);
      } else {
        typeLine(nowLabel(), "WAIT", "I log di oggi sono terminati. Prossimo ciclo: domani alle 06:00.");
      }
    }, 1200);

    logInterval = setInterval(checkScheduledLog, 20000);
  }

  setTimeout(printCommunitySignal, 9000);
  communityInterval = setInterval(printCommunitySignal, 3 * 60 * 1000);

  loadArchiveIndex();
}

function printTodayUnlockedLogs() {
  const now = new Date();
  const currentHour = now.getHours();

  logSchedule.forEach((item) => {
    if (currentHour < item.hour) return;

    const log = config.logs?.[item.key];
    if (!log || !clean(log.text)) return;

    const storageKey = getStorageKey(item.key);
    localStorage.setItem(storageKey, "printed");

    typeLine(item.label, log.category || "MAT", log.text);

    if (item.key === "09") {
      printSelectedCommand();
    }
  });
}

function checkScheduledLog() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const item = logSchedule.find((log) => log.hour === hour);
  if (!item || minute > 4) return;

  const storageKey = getStorageKey(item.key);
  if (localStorage.getItem(storageKey) === "printed") return;

  const log = config.logs?.[item.key];
  if (!log || !clean(log.text)) return;

  localStorage.setItem(storageKey, "printed");
  typeLine(item.label, log.category || "MAT", log.text);

  if (item.key === "09") {
    printSelectedCommand();
  }
}

function getNextLog() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  return logSchedule.find((item) => {
    if (hour < item.hour) return true;
    if (hour === item.hour && minute <= 4) return true;
    return false;
  });
}

function printSelectedCommand() {
  if (!Array.isArray(config.selectedCommands)) return;

  const command = clean(config.selectedCommands[0]);
  if (!command) return;

  typeLine("09:01", "COMMAND", `Comando selezionato da terminal.clochardcoin.it: “${command}”`);
  typeLine("09:02", "MAT", "Lo userò come traccia della missione di oggi.");
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
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      console.warn("Supabase read non disponibile:", await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn("Comandi community non disponibili:", error);
    return [];
  }
}

async function printCommunitySignal() {
  const commands = await fetchCommunityCommands();

  if (!commands.length) return;

  const freshCommands = commands.filter((item) => item.id !== lastCommunityCommandId);
  const pool = freshCommands.length ? freshCommands : commands;
  const item = pool[Math.floor(Math.random() * pool.length)];

  if (!item || !clean(item.command)) return;

  lastCommunityCommandId = item.id;

  const nickname = clean(item.nickname) || "utente_anonimo";

  typeLine(nowLabel(), "USER_SIGNAL", `@${nickname}: ${item.command}`);
  typeLine(nowLabel(), "MAT", "Segnale approvato. Potrebbe diventare parte del prossimo log.");
}

async function loadArchiveIndex() {
  if (!el.archiveList) return;

  const archiveDates = buildArchiveDates(20);
  const archiveItems = [];

  for (const date of archiveDates) {
    try {
      const response = await fetch(`./archive/${date}.json?nocache=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (!data || !data.date) continue;

      archiveItems.push(data);
    } catch {
      continue;
    }
  }

  renderArchive(archiveItems);
}

function buildArchiveDates(daysBack) {
  const dates = [];
  const today = new Date();

  for (let i = 1; i <= daysBack; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function renderArchive(items) {
  if (!el.archiveList) return;

  if (!items.length) {
    el.archiveList.innerHTML = `
      <div class="archive-empty">
        Archivio in attesa dei primi salvataggi da Termux.
      </div>
    `;
    return;
  }

  el.archiveList.innerHTML = "";

  items.forEach((day) => {
    const details = document.createElement("details");
    details.className = "archive-day";

    const logs = day.logs || {};

    details.innerHTML = `
      <summary>${escapeHtml(day.date || "giorno senza data")}</summary>

      <div class="archive-day-content">
        <p class="archive-objective">
          ${escapeHtml(day.dailyObjective || "Obiettivo non disponibile")}
        </p>

        ${renderArchiveLog("06:00", logs["06"])}
        ${renderArchiveLog("09:00", logs["09"])}
        ${renderArchiveLog("12:00", logs["12"])}
        ${renderArchiveLog("15:00", logs["15"])}
        ${renderArchiveLog("18:00", logs["18"])}
        ${renderArchiveLog("20:00", logs["20"])}
      </div>
    `;

    el.archiveList.appendChild(details);
  });
}

function renderArchiveLog(label, log) {
  if (!log || !clean(log.text)) return "";

  return `
    <p class="archive-log">
      <span>[${escapeHtml(label)}] [${escapeHtml(log.category || "MAT")}]</span>
      ${escapeHtml(log.text)}
    </p>
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
    await sleep(18 + Math.random() * 26);
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

function getStorageKey(logKey) {
  const date = clean(config.date) || new Date().toISOString().slice(0, 10);
  return `mat-log-${date}-${logKey}`;
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
  return String(value)
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