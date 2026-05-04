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

let config = fallbackConfig;
let audioEnabled = false;
let logInterval = null;
let communityInterval = null;
let lastCommunityCommandId = null;

const el = {
  dailyObjective: document.getElementById("dailyObjective"),
  instagramFollowers: document.getElementById("instagramFollowers"),
  telegramUsers: document.getElementById("telegramUsers"),
  tiktokFollowers: document.getElementById("tiktokFollowers"),
  youtubeStatus: document.getElementById("youtubeStatus"),
  solanaWallet: document.getElementById("solanaWallet"),
  minimumDonation: document.getElementById("minimumDonation"),
  instagramLink: document.getElementById("instagramLink"),
  telegramLink: document.getElementById("telegramLink"),
  tiktokLink: document.getElementById("tiktokLink"),
  terminalLink: document.getElementById("terminalLink"),
  donateBtn: document.getElementById("donateBtn"),
  copyWalletBtn: document.getElementById("copyWalletBtn"),
  terminal: document.getElementById("terminal"),
  ambientAudio: document.getElementById("ambientAudio"),
  toggleAudioBtn: document.getElementById("toggleAudioBtn"),
  toast: document.getElementById("toast"),
  matAvatar: document.getElementById("matAvatar"),
  matPlaceholder: document.getElementById("matPlaceholder")
};

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
    config = fallbackConfig;
  }

  applyConfig();
  startTerminal();
}

function mergeConfig(base, external) {
  return {
    ...base,
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
  el.dailyObjective.textContent =
    clean(config.dailyObjective) || "In attesa dell'input serale da Termux";

  el.instagramFollowers.textContent = config.instagramFollowers;
  el.telegramUsers.textContent = config.telegramUsers;
  el.tiktokFollowers.textContent = config.tiktokFollowers;
  el.youtubeStatus.textContent = config.youtubeStatus;
  el.solanaWallet.textContent = config.solanaWallet;
  el.minimumDonation.textContent = config.minimumDonation;

  el.instagramLink.href = config.socialLinks.instagram || "#";
  el.telegramLink.href = config.socialLinks.telegram || "#";
  el.tiktokLink.href = config.socialLinks.tiktok || "#";
  el.terminalLink.href =
    config.socialLinks.terminal || "https://terminal.clochardcoin.it";

  el.donateBtn.textContent = `Dona ${config.minimumDonation}`;
}

function startTerminal() {
  el.terminal.innerHTML = "";

  if (logInterval) clearInterval(logInterval);
  if (communityInterval) clearInterval(communityInterval);

  const hasMission = clean(config.dailyObjective).length > 0;
  const hasLogs = Object.values(config.logs || {}).some((log) => clean(log.text).length > 0);

  if (!hasMission && !hasLogs) {
    typeLine(nowLabel(), "STANDBY", "In attesa dell'input serale da Termux.");
  } else {
    typeLine(
      nowLabel(),
      "STANDBY",
      "Mat è online. I log appariranno solo agli orari programmati: 06, 09, 12, 15, 18, 20."
    );

    setTimeout(() => {
      const next = getNextLog();

      if (next) {
        typeLine(nowLabel(), "WAIT", `Prossimo log programmato: ${next.label}.`);
      } else {
        typeLine(
          nowLabel(),
          "WAIT",
          "I log di oggi sono terminati. Prossimo ciclo: domani alle 06:00."
        );
      }
    }, 1500);

    checkScheduledLog();

    logInterval = setInterval(() => {
      checkScheduledLog();
    }, 20000);
  }

  setTimeout(() => {
    printCommunitySignal();
  }, 5000);

  communityInterval = setInterval(() => {
    printCommunitySignal();
  }, 3 * 60 * 1000);
}

function checkScheduledLog() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const item = logSchedule.find((log) => log.hour === hour);

  if (!item) return;

  const insideWindow = minute >= 0 && minute <= 4;

  if (!insideWindow) return;

  const storageKey = getStorageKey(item.key);

  if (localStorage.getItem(storageKey) === "printed") return;

  const log = config.logs[item.key];

  if (!log || !clean(log.text)) return;

  localStorage.setItem(storageKey, "printed");

  typeLine(item.label, log.category || "MAT", log.text);

  if (item.key === "09") {
    setTimeout(printSelectedCommand, 1700);
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
  if (config.selectedCommands.length === 0) return;

  const command = clean(config.selectedCommands[0]);

  if (!command) return;

  typeLine(
    "09:01",
    "COMMAND",
    `Comando selezionato da terminal.clochardcoin.it: “${command}”`
  );

  setTimeout(() => {
    typeLine("09:02", "MAT", "Lo userò come traccia della missione di oggi.");
  }, 1800);
}async function fetchCommunityCommands() {
  try {
    const query =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,created_at,status` +
      `&status=eq.pending` +
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

  typeLine(
    nowLabel(),
    "USER_SIGNAL",
    `@${nickname}: ${item.command}`
  );

  setTimeout(() => {
    typeLine(
      nowLabel(),
      "MAT",
      "Segnale ricevuto. Potrebbe diventare parte del prossimo log."
    );
  }, 1800);
}

async function typeLine(label, category, text) {
  if (!clean(text)) return;

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
  limitLines();
}

function formatLine(text) {
  const match = text.match(/^(\[[^\]]+\])\s(\[[^\]]+\])\s?(.*)$/);

  if (!match) return escapeHtml(text);

  return `<span class="time">${escapeHtml(match[1])}</span> <span class="category">${escapeHtml(match[2])}</span> ${escapeHtml(match[3])}`;
}

function limitLines() {
  while (el.terminal.children.length > 16) {
    el.terminal.removeChild(el.terminal.firstChild);
  }
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
  el.toast.textContent = message;
  el.toast.classList.add("show");

  setTimeout(() => {
    el.toast.classList.remove("show");
  }, 2600);
}

function setupButtons() {
  el.copyWalletBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(config.solanaWallet);
      showToast("Wallet copiato.");
    } catch {
      showToast("Copia non riuscita. Tieni premuto sul wallet.");
    }
  });

  el.donateBtn.addEventListener("click", () => {
    const amount = String(config.minimumDonation || "0.01 SOL").replace(" SOL", "");
    const label = encodeURIComponent("Supporta Mat Clochard");
    const solanaPayUrl = `solana:${config.solanaWallet}?amount=${amount}&label=${label}`;

    window.location.href = solanaPayUrl;

    setTimeout(() => {
      showToast("Se il wallet non si apre, copia il wallet e invia manualmente.");
    }, 800);
  });

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

function setupMatFallback() {
  el.matAvatar.addEventListener("error", () => {
    el.matAvatar.style.display = "none";
    el.matPlaceholder.style.display = "grid";
  });
}

setupButtons();
setupMatFallback();
loadConfig();