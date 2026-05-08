const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const CONFIG_TABLE = "mat_live_config";
const COMMANDS_TABLE = "mat_commands";
const REPORTS_TABLE = "mat_reports_archive";
const CONFIG_ID = 1;

const fallbackConfig = {
  liveDate: "",
  dailyObjective: "In attesa della missione del giorno",
  matStatus: "ONLINE",
  matMode: "IDLE",
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
    terminal: "https://www.clochardcoin.it/terminal/",
    live: "https://www.clochardcoin.it/live/"
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

let config = JSON.parse(JSON.stringify(fallbackConfig));
let audioEnabled = false;
let terminalQueue = Promise.resolve();
let configInterval = null;
let archiveInterval = null;
let missionPulseInterval = null;
let communityInterval = null;
let printedLogKeys = new Set();
let printedCommandIds = new Set();
let lastMissionText = "";
let lastModeText = "";
let bootPrinted = false;
let currentReports = [];
let selectedReportId = null;

const $ = (id) => document.getElementById(id);
let el = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  el = {
    matStatus: $("matStatus"),
    matMode: $("matMode"),
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
    archiveList: $("archiveList"),
    reportViewer: $("reportViewer")
  };

  applyConfig();
  setupButtons();
  setupMatFallback();
  setupArchiveClicks();
  startLive();
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function startLive() {
  if (el.terminal) el.terminal.innerHTML = "";

  printBootSequence();

  await refreshLiveData(true);

  clearInterval(configInterval);
  clearInterval(archiveInterval);
  clearInterval(missionPulseInterval);
  clearInterval(communityInterval);

  configInterval = setInterval(() => refreshLiveData(false), 12000);
  archiveInterval = setInterval(loadArchiveFromSupabase, 60000);
  communityInterval = setInterval(printNewCommunitySignals, 18000);
  missionPulseInterval = setInterval(printMissionPulse, 90000);
}

function printBootSequence() {
  if (bootPrinted) return;
  bootPrinted = true;

  typeLine(nowLabel(), "BOOT", "MAT CLOCHARD LIVE NODE ONLINE.");
  typeLine(nowLabel(), "SYSTEM", "Canale live sincronizzato con il cervello operativo.");
  typeLine(nowLabel(), "MISSION", "In attesa della missione attiva.");
}

async function refreshLiveData(firstLoad = false) {
  await loadConfigFromSupabase();
  await updateCommunityStats();
  applyConfig();

  if (firstLoad || config.dailyObjective !== lastMissionText) {
    lastMissionText = config.dailyObjective;
    typeLine(nowLabel(), "MISSION", config.dailyObjective);
    typeLine(nowLabel(), "STATUS", `Stato: ${config.matStatus} · Modalità: ${config.matMode} · Energia: ${config.matEnergy}%`);
  }

  if (!firstLoad && config.matMode !== lastModeText) {
    typeLine(nowLabel(), "STATUS", `Modalità operativa aggiornata: ${config.matMode}`);
  }

  lastModeText = config.matMode;

  printAvailableScheduledLogs();
  loadArchiveFromSupabase();
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
      ...JSON.parse(JSON.stringify(fallbackConfig)),
      liveDate: data.live_date || "",
      dailyObjective: data.daily_objective || fallbackConfig.dailyObjective,
      matStatus: data.mat_status || fallbackConfig.matStatus,
      matMode: data.mat_mode || fallbackConfig.matMode,
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
    typeLine(nowLabel(), "ERROR", "Config Supabase non caricata. Uso fallback locale.");
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
  setText(el.matMode, config.matMode);
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

  document.body.className = document.body.className
    .replace(/\bmode-[A-Z]+\b/g, "")
    .trim();

  document.body.classList.add(`mode-${config.matMode || "IDLE"}`);

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
  } else {
    config.lastSignal = "IN ASCOLTO";
  }
}

function printMissionPulse() {
  const mission = clean(config.dailyObjective);
  const mode = clean(config.matMode) || "IDLE";

  if (!mission || mission === fallbackConfig.dailyObjective) {
    typeLine(nowLabel(), "IDLE", "Nessuna missione attiva. Mat resta in ascolto della community.");
    return;
  }

  const pulsesByMode = {
    IDLE: [
      "Nodo in attesa. La missione resta sospesa finché non arrivano nuovi segnali.",
      `Missione registrata ma non ancora in esecuzione: ${mission}`
    ],
    SCANNING: [
      `Scansione attiva sulla missione: ${mission}`,
      "Mat raccoglie segnali, filtra rumore e cerca piste verificabili.",
      "Scansione lenta. Nessun risultato confermato ancora."
    ],
    ANALYZING: [
      "Analisi in corso. Mat separa fonti utili, segnali deboli e dati sporchi.",
      `Mat sta valutando la missione: ${mission}`,
      "Priorità aggiornata. La memoria temporanea sta ordinando i segnali."
    ],
    EXECUTING: [
      "Esecuzione missione in corso. Mat prova a trasformare i segnali in azioni.",
      `Mat lavora sull’obiettivo: ${mission}`,
      "Nodo operativo attivo. Output parziale in preparazione."
    ],
    REPORTING: [
      "Fase report. Mat sta consolidando risultati e fallimenti della missione.",
      `Preparazione riepilogo missione: ${mission}`,
      "Memoria del giorno in aggiornamento."
    ],
    COMPLETED: [
      "Missione completata. Report salvato nella memoria di Mat.",
      `Soluzione pubblicata per la missione: ${mission}`,
      "Mat torna in ascolto del prossimo comando."
    ],
    ALERT: [
      "Anomalia rilevata. Mat rallenta la scansione.",
      "Segnale instabile. Serve verifica manuale dal moderatore.",
      "Rumore alto. Possibile missione da ripulire."
    ]
  };

  const pulses = pulsesByMode[mode] || pulsesByMode.SCANNING;
  const index = Math.floor(Math.random() * pulses.length);

  typeLine(nowLabel(), mode === "IDLE" ? "IDLE" : "SCAN", pulses[index]);
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
    if (currentMinutes < Number(hour) * 60) return;

    const logKey = `${liveDate}-${hour}-${text}`;

    if (printedLogKeys.has(logKey)) return;

    printedLogKeys.add(logKey);
    typeLine(`${hour}:00`, getLogCategory(hour), text);
  });
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

async function printNewCommunitySignals() {
  const commands = await fetchCommunityCommands(10);
  if (!commands.length) return;

  const newCommands = commands
    .filter((item) => !printedCommandIds.has(item.id))
    .reverse();

  if (!newCommands.length) return;

  newCommands.forEach((item) => {
    if (!item || !clean(item.command)) return;

    printedCommandIds.add(item.id);

    const nickname = clean(item.nickname) || "utente_anonimo";
    config.lastSignal = nickname;

    if (config.matMode === "IDLE") {
      config.matMode = "ANALYZING";
    }

    applyConfig();

    typeLine(nowLabel(), "USER_SIGNAL", `@${nickname}: ${item.command}`);
    typeLine(nowLabel(), "MAT", "Segnale approvato. Mat lo registra nella memoria temporanea.");
  });
}

async function loadArchiveFromSupabase() {
  if (!el.archiveList) return;

  try {
    const query =
      `${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}` +
      `?select=id,created_at,command_id,nickname,command,mat_solution,mat_status,mat_mode,mat_energy` +
      `&order=created_at.desc` +
      `&limit=30`;

    const response = await fetch(query, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    currentReports = await response.json();
    renderArchive(currentReports);
  } catch (error) {
    console.warn("Errore archivio report:", error);

    el.archiveList.innerHTML = `
      <div class="archive-empty">
        Archivio report non disponibile. Controlla la tabella mat_reports_archive.
      </div>
    `;
  }
}

function renderArchive(items) {
  if (!el.archiveList) return;

  if (!items.length) {
    el.archiveList.innerHTML = `
      <div class="archive-empty">
        Nessun report completato. Quando Mat pubblica una soluzione, apparirà qui.
      </div>
    `;

    renderReportViewer(null);
    return;
  }

  if (!selectedReportId || !items.some((item) => String(item.id) === String(selectedReportId))) {
    selectedReportId = items[0].id;
  }

  el.archiveList.innerHTML = "";

  items.forEach((report) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "report-list-item";
    button.dataset.reportId = report.id;

    if (String(report.id) === String(selectedReportId)) {
      button.classList.add("active");
    }

    button.innerHTML = `
      <span>${escapeHtml(formatDateTimeIt(report.created_at))}</span>
      <strong>@${escapeHtml(report.nickname || "utente_anonimo")}</strong>
      <small>${escapeHtml(shortText(report.command || "Comando non disponibile", 92))}</small>
    `;

    el.archiveList.appendChild(button);
  });

  const selected = items.find((item) => String(item.id) === String(selectedReportId)) || items[0];
  renderReportViewer(selected);
}

function setupArchiveClicks() {
  if (!el.archiveList) return;

  el.archiveList.addEventListener("click", (event) => {
    const button = event.target.closest(".report-list-item");
    if (!button) return;

    selectedReportId = button.dataset.reportId;

    renderArchive(currentReports);
  });
}

function renderReportViewer(report) {
  if (!el.reportViewer) return;

  if (!report) {
    el.reportViewer.innerHTML = `
      <span class="report-viewer-kicker">MEMORIA SELEZIONATA</span>
      <h3>Seleziona un report</h3>
      <p>
        Clicca una missione completata dalla lista per leggere il comando,
        la soluzione di Mat e le fonti collegate.
      </p>
    `;
    return;
  }

  el.reportViewer.innerHTML = `
    <span class="report-viewer-kicker">REPORT COMPLETATO</span>

    <h3>@${escapeHtml(report.nickname || "utente_anonimo")}</h3>

    <p class="report-meta">
      ${escapeHtml(formatDateTimeIt(report.created_at))} ·
      Stato: ${escapeHtml(report.mat_status || "ONLINE")} ·
      Modalità: ${escapeHtml(report.mat_mode || "COMPLETED")} ·
      Energia: ${escapeHtml(report.mat_energy ?? 0)}%
    </p>

    <div class="report-viewer-block">
      <strong>COMANDO</strong>
      <p>${escapeHtml(report.command || "Comando non disponibile")}</p>
    </div>

    <div class="report-viewer-block">
      <strong>SOLUZIONE DI MAT</strong>
      <p>${linkifyText(report.mat_solution || "Soluzione non disponibile")}</p>
    </div>
  `;
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

function formatDateTimeIt(value) {
  if (!value) return "Data non disponibile";

  try {
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
}

function typeLine(label, category, text) {
  terminalQueue = terminalQueue.then(() => typeLineInternal(label, category, text));
  return terminalQueue;
}

async function typeLineInternal(label, category, text) {
  if (!el.terminal || !clean(text)) return;

  const line = document.createElement("p");
  line.className = `terminal-line cursor cat-${category}`;

  if (category === "REPORT" || category === "ERROR") {
    line.classList.add("alert");
  }

  el.terminal.appendChild(line);

  const full = `[${label}] [${category}] ${text}`;

  for (let i = 0; i <= full.length; i++) {
    line.innerHTML = formatLine(full.slice(0, i));
    el.terminal.scrollTop = el.terminal.scrollHeight;
    await sleep(10 + Math.random() * 12);
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function nowLabel() {
  return new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shortText(value, max = 90) {
  const text = clean(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
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

function linkifyText(value) {
  const escaped = escapeHtml(value || "");

  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
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