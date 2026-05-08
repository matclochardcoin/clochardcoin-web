const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const CONFIG_TABLE = "mat_live_config";
const COMMANDS_TABLE = "mat_commands";
const ARCHIVE_TABLE = "mat_live_archive";
const CONFIG_ID = 1;

const fallbackConfig = {
  liveDate: "",
  dailyObjective: "In attesa della missione del giorno",
  matStatus: "ONLINE",
  matEnergy: 21,
  communityNodes: 0,
  lastSignal: "IN ASCOLTO",
  instagramFollowers: 0,
  telegramUsers: 0,
  tiktokFollowers: 0,
  youtubeStatus: "A BREVE",
  solanaWallet: "5sc1W9g5VVyBW9EhU5oYhhDF49K751mKjZWo92iemTji",
  minimumDonation: "0.01 SOL",
  socialLinks: {
    instagram: "https://www.instagram.com/clochard_coin?igsh=ZGxnbGV1aWs3OGpr",
    telegram: "https://t.me/+2WX7IXU1CzBlNzc0",
    tiktok: "https://www.tiktok.com/@matt.clochard?_r=1&_t=ZN-9679EEU85TT",
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
let archiveInterval = null;
let printedLogKeys = new Set();
let lastCommunityCommandId = null;

const $ = (id) => document.getElementById(id);
let el = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  el = {
    matStatus: $("matStatus"),
    matEnergy: $("matEnergy"),
    energyBar: $("energyBar"),
    communityNodes: $("communityNodes"),
    lastSignal: $("lastSignal"),
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
    matVideo: $("matVideo"),
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

  typeLine(nowLabel(), "BOOT", "MAT CLOCHARD LIVE NODE ONLINE.");
  typeLine(nowLabel(), "SYSTEM", "Modalità ecosistema attiva.");
  typeLine(nowLabel(), "SIGNAL", "Mat resta in ascolto dei segnali community.");

  await loadConfigFromSupabase();
  await updateCommunityStats();

  applyConfig();
  printAvailableScheduledLogs();
  loadArchiveFromSupabase();

  clearInterval(configInterval);
  clearInterval(liveSignalInterval);
  clearInterval(communityInterval);
  clearInterval(archiveInterval);

  configInterval = setInterval(async () => {
    await loadConfigFromSupabase();
    await updateCommunityStats();
    applyConfig();
    printAvailableScheduledLogs();
  }, 10000);

  liveSignalInterval = setInterval(() => {
    const signals = [
      "scan...",
      "retry...",
      "memoria locale stabile.",
      "Mat monitora la strada digitale.",
      "nodo live ancora attivo.",
      "nessun comando urgente rilevato.",
      "missione giornaliera in esecuzione.",
      "connessione community verificata."
    ];

    typeLine(nowLabel(), "LIVE", signals[Math.floor(Math.random() * signals.length)]);
  }, 60000);

  communityInterval = setInterval(printCommunitySignal, 15000);
  archiveInterval = setInterval(loadArchiveFromSupabase, 60000);

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

    if (!response.ok) throw new Error(await response.text());

    const rows = await response.json();
    const data = rows[0];

    if (!data) return;

    config = {
      ...structuredClone(fallbackConfig),
      liveDate: data.live_date || "",
      dailyObjective: data.daily_objective || fallbackConfig.dailyObjective,
      matStatus: data.mat_status || fallbackConfig.matStatus,
      matEnergy: data.mat_energy ?? fallbackConfig.matEnergy,
      instagramFollowers: data.instagram_followers ?? 0,
      telegramUsers: data.telegram_followers ?? 0,
      tiktokFollowers: data.tiktok_followers ?? 0,
      youtubeStatus: data.youtube_status || fallbackConfig.youtubeStatus,
      solanaWallet: data.solana_wallet || fallbackConfig.solanaWallet,
      minimumDonation: data.minimum_donation || fallbackConfig.minimumDonation,
      socialLinks: {
        ...fallbackConfig.socialLinks,
        instagram: data.instagram_link || fallbackConfig.socialLinks.instagram,
        telegram: data.telegram_link || fallbackConfig.socialLinks.telegram,
        tiktok: data.tiktok_link || fallbackConfig.socialLinks.tiktok,
        terminal: data.terminal_link || fallbackConfig.socialLinks.terminal,
        live: data.live_link || fallbackConfig.socialLinks.live
      },
      logs: normalizeLogs(data.scheduled_logs || fallbackConfig.logs)
    };
  } catch (error) {
    console.warn("Errore config Supabase:", error);
  }
}

function normalizeLogs(rawLogs) {
  const normalized = {};

  ["06", "09", "12", "15", "18", "20"].forEach((hour) => {
    const value = rawLogs?.[hour];

    if (typeof value === "string") {
      normalized[hour] = value;
      return;
    }

    if (value && typeof value === "object") {
      normalized[hour] = value.text || "";
      return;
    }

    normalized[hour] = "";
  });

  return normalized;
}

function applyConfig() {
  const energy = clampNumber(config.matEnergy, 0, 100);

  setText(el.matStatus, config.matStatus);
  setText(el.matEnergy, energy);
  setText(el.communityNodes, config.communityNodes);
  setText(el.lastSignal, config.lastSignal);
  setText(el.dailyObjective, config.dailyObjective);
  setText(el.instagramFollowers, config.instagramFollowers);
  setText(el.telegramUsers, config.telegramUsers);
  setText(el.tiktokFollowers, config.tiktokFollowers);
  setText(el.youtubeStatus, config.youtubeStatus);
  setText(el.solanaWallet, config.solanaWallet);
  setText(el.minimumDonation, config.minimumDonation);

  if (el.energyBar) {
    el.energyBar.style.width = `${energy}%`;
  }

  setHref(el.instagramLink, config.socialLinks.instagram);
  setHref(el.telegramLink, config.socialLinks.telegram);
  setHref(el.tiktokLink, config.socialLinks.tiktok);
  setHref(el.terminalLink, config.socialLinks.terminal);

  if (el.donateBtn) {
    el.donateBtn.textContent = `Ricarica ${config.minimumDonation}`;
  }
}

async function updateCommunityStats() {
  const commands = await fetchCommunityCommands(50);

  config.communityNodes = commands.length;

  if (commands.length) {
    const latest = commands[0];
    config.lastSignal = clean(latest.nickname) || "NODE";
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function logHourToMinutes(hour) {
  return Number(hour) * 60;
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

function printAvailableScheduledLogs() {
  const liveDate = config.liveDate || todayIsoDate();
  const today = todayIsoDate();

  if (liveDate > today) {
    const waitKey = `waiting-${liveDate}`;

    if (!printedLogKeys.has(waitKey)) {
      printedLogKeys.add(waitKey);
      typeLine(nowLabel(), "WAIT", `Log programmati per il ${formatDateIt(liveDate)}. Mat resta online in attesa.`);
    }

    return;
  }

  if (liveDate < today) return;

  const currentMinutes = getCurrentMinutes();
  const hours = ["06", "09", "12", "15", "18", "20"];

  hours.forEach((hour) => {
    const text = clean(config.logs?.[hour]);

    if (!text) return;
    if (currentMinutes < logHourToMinutes(hour)) return;

    const logKey = `${liveDate}-${hour}-${text}`;

    if (printedLogKeys.has(logKey)) return;

    printedLogKeys.add(logKey);
    typeLine(`${hour}:00`, getLogCategory(hour), text);
  });
}

async function fetchCommunityCommands(limit = 5) {
  try {
    const query =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,created_at,status` +
      `&status=eq.approved` +
      `&order=created_at.desc` +
      `&limit=${limit}`;

    const response = await fetch(query, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    return await response.json();
  } catch (error) {
    console.warn("Errore comandi community:", error);
    return [];
  }
}

async function printCommunitySignal() {
  const commands = await fetchCommunityCommands(5);
  if (!commands.length) return;

  const fresh = commands.filter((item) => item.id !== lastCommunityCommandId);
  const pool = fresh.length ? fresh : commands;
  const item = pool[Math.floor(Math.random() * pool.length)];

  if (!item || !clean(item.command)) return;

  lastCommunityCommandId = item.id;

  const nickname = clean(item.nickname) || "utente_anonimo";
  config.lastSignal = nickname;
  applyConfig();

  typeLine(nowLabel(), "USER_SIGNAL", `@${nickname}: ${item.command}`);
  typeLine(nowLabel(), "MAT", "Segnale ricevuto. Missione candidata alla memoria del nodo.");
}

async function loadArchiveFromSupabase() {
  if (!el.archiveList) return;

  try {
    const query =
      `${SUPABASE_URL}/rest/v1/${ARCHIVE_TABLE}` +
      `?select=archive_date,live_date,daily_objective,instagram_followers,telegram_followers,tiktok_followers,scheduled_logs,created_at` +
      `&order=archive_date.desc` +
      `&limit=20`;

    const response = await fetch(query, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    const archiveItems = await response.json();
    renderArchive(archiveItems);
  } catch (error) {
    console.warn("Errore archivio Supabase:", error);

    el.archiveList.innerHTML = `
      <div class="archive-empty">
        Archivio non disponibile. Controlla la tabella mat_live_archive.
      </div>
    `;
  }
}

function renderArchive(items) {
  if (!el.archiveList) return;

  if (!items.length) {
    el.archiveList.innerHTML = `
      <div class="archive-empty">
        Archivio in attesa dei primi salvataggi dal pannello moderatore.
      </div>
    `;
    return;
  }

  el.archiveList.innerHTML = "";

  items.forEach((day) => {
    const details = document.createElement("details");
    details.className = "archive-day";

    const logs = normalizeLogs(day.scheduled_logs || {});
    const date = day.live_date || day.archive_date;

    details.innerHTML = `
      <summary>${formatDateIt(date)}</summary>

      <div class="archive-day-content">
        <p class="archive-objective">
          ${escapeHtml(day.daily_objective || "Missione non disponibile")}
        </p>

        <p class="archive-stats">
          Instagram: ${escapeHtml(day.instagram_followers ?? 0)} ·
          Telegram: ${escapeHtml(day.telegram_followers ?? 0)} ·
          TikTok: ${escapeHtml(day.tiktok_followers ?? 0)}
        </p>

        ${renderArchiveLog("06:00", "BOOT", logs["06"])}
        ${renderArchiveLog("09:00", "USER_SIGNAL", logs["09"])}
        ${renderArchiveLog("12:00", "SCAN", logs["12"])}
        ${renderArchiveLog("15:00", "RESULT", logs["15"])}
        ${renderArchiveLog("18:00", "MAT", logs["18"])}
        ${renderArchiveLog("20:00", "REPORT", logs["20"])}
      </div>
    `;

    el.archiveList.appendChild(details);
  });
}

function renderArchiveLog(label, category, text) {
  if (!clean(text)) return "";

  return `
    <p class="archive-log">
      <span>[${escapeHtml(label)}] [${escapeHtml(category)}]</span>
      ${escapeHtml(text)}
    </p>
  `;
}

function formatDateIt(value) {
  if (!value) return "Giorno senza data";

  const [year, month, day] = String(value).split("-");

  if (!year || !month || !day) return escapeHtml(value);

  return `${day}/${month}/${year}`;
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
    await sleep(12 + Math.random() * 16);
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

function clampNumber(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.max(min, Math.min(max, number));
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
      const label = encodeURIComponent("Ricarica Mat Clochard");
      const solanaPayUrl = `solana:${config.solanaWallet}?amount=${amount}&label=${label}`;

      window.location.href = solanaPayUrl;

      setTimeout(() => {
        showToast("Se Phantom non si apre, copia il wallet e invia manualmente.");
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
  if (!el.matVideo || !el.matPlaceholder) return;

  el.matVideo.addEventListener("error", () => {
    el.matVideo.style.display = "none";
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