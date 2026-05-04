const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";
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

let config = structuredClone(fallbackConfig);
let audioEnabled = false;
let communityInterval = null;
let terminalQueue = Promise.resolve();
let shownGeneratedLogs = 0;
let generatedLogsInterval = null;
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

  clearInterval(communityInterval);
  clearInterval(generatedLogsInterval);

  typeLine(nowLabel(), "BOOT", "CLOCHARDCOIN LIVE TERMINAL ONLINE.");
  typeLine(nowLabel(), "MAT_AI", "Connessione ai log generati da Termux...");

  loadGeneratedLogs();
  generatedLogsInterval = setInterval(loadGeneratedLogs, 10000);

  setTimeout(printCommunitySignal, 9000);
  communityInterval = setInterval(printCommunitySignal, 3 * 60 * 1000);

  loadArchiveIndex();
}

async function loadGeneratedLogs() {
  try {
    const response = await fetch(`../logs.json?nocache=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      typeLine(nowLabel(), "WAIT", "logs.json non ancora disponibile.");
      return;
    }

    const logs = await response.json();

    if (!Array.isArray(logs)) return;

    for (let i = shownGeneratedLogs; i < logs.length; i++) {
      const log = logs[i];

      if (!log || !clean(log.message)) continue;

      if (clean(log.objective)) {
        setText(el.dailyObjective, log.objective);
      }

      const label = `${String(log.hour).padStart(2, "0")}:00`;
      const category = Number(log.hour) === 20 ? "REPORT" : "MAT";

      typeLine(label, category, log.message);

      shownGeneratedLogs++;
    }

    if (logs.length === shownGeneratedLogs) {
      const idleMessages = [
        "Monitoraggio segnali community...",
        "Sincronizzazione narrativa in corso...",
        "Mat resta online in attesa del prossimo log.",
        "Analisi presenza digitale attiva..."
      ];

      const msg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
      typeLine(nowLabel(), "LIVE", msg);
    }
  } catch (error) {
    console.warn("Errore lettura logs.json:", error);
  }
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
