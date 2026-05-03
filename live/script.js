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
    "06": {
      category: "BOOT",
      text: ""
    },
    "09": {
      category: "USER_SIGNAL",
      text: ""
    },
    "12": {
      category: "SCAN",
      text: ""
    },
    "15": {
      category: "RESULT",
      text: ""
    },
    "18": {
      category: "MAT",
      text: ""
    },
    "20": {
      category: "REPORT",
      text: ""
    }
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
let printedLogs = new Set();
let audioEnabled = false;

const elements = {
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
    const response = await fetch("./live-config.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Config non disponibile");
    }

    const externalConfig = await response.json();
    config = mergeConfig(fallbackConfig, externalConfig);
  } catch (error) {
    config = fallbackConfig;
    console.warn("Uso configurazione fallback:", error);
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
      : base.selectedCommands
  };
}

function applyConfig() {
  const missionText = cleanText(config.dailyObjective);

  elements.dailyObjective.textContent = missionText || "In attesa dell'input serale da Termux";

  elements.instagramFollowers.textContent = config.instagramFollowers;
  elements.telegramUsers.textContent = config.telegramUsers;
  elements.tiktokFollowers.textContent = config.tiktokFollowers;
  elements.youtubeStatus.textContent = config.youtubeStatus;
  elements.solanaWallet.textContent = config.solanaWallet;
  elements.minimumDonation.textContent = config.minimumDonation;

  elements.instagramLink.href = config.socialLinks.instagram || "#";
  elements.telegramLink.href = config.socialLinks.telegram || "#";
  elements.tiktokLink.href = config.socialLinks.tiktok || "#";
  elements.terminalLink.href = config.socialLinks.terminal || "https://terminal.clochardcoin.it";

  elements.donateBtn.textContent = `Dona ${config.minimumDonation}`;
}

function startTerminal() {
  elements.terminal.innerHTML = "";
  printedLogs.clear();

  const hasMission = cleanText(config.dailyObjective).length > 0;
  const hasAnyLog = Object.values(config.logs || {}).some((log) => cleanText(log.text).length > 0);

  if (!hasMission && !hasAnyLog) {
    typeLine({
      label: getCurrentTimeLabel(),
      category: "STANDBY",
      text: "In attesa dell'input serale da Termux."
    });

    return;
  }

  typeLine({
    label: getCurrentTimeLabel(),
    category: "BOOT",
    text: "Connessione al terminale di Mat Clochard..."
  });

  if (hasMission) {
    setTimeout(() => {
      typeLine({
        label: getCurrentTimeLabel(),
        category: "MISSION",
        text: `Missione attiva: ${config.dailyObjective}`
      });
    }, 1300);
  }

  setTimeout(() => {
    printUnlockedLogs();
    printSelectedCommandIntro();
  }, 2600);

  setInterval(() => {
    printUnlockedLogs();
  }, 30 * 1000);
}

function printUnlockedLogs() {
  const currentHour = new Date().getHours();

  logSchedule.forEach((item) => {
    if (currentHour >= item.hour && !printedLogs.has(item.key)) {
      const log = config.logs[item.key];

      if (!log || cleanText(log.text).length === 0) {
        return;
      }

      printedLogs.add(item.key);

      typeLine({
        label: item.label,
        category: log.category || "MAT",
        text: log.text
      });

      if (item.key === "09") {
        setTimeout(() => {
          printSelectedCommand();
        }, 1700);
      }
    }
  });
}

function printSelectedCommandIntro() {
  const currentHour = new Date().getHours();

  if (currentHour < 9 && config.selectedCommands.length > 0) {
    typeLine({
      label: getCurrentTimeLabel(),
      category: "USER_SIGNAL",
      text: "I comandi della community verranno letti durante la giornata."
    });
  }
}

function printSelectedCommand() {
  if (!config.selectedCommands || config.selectedCommands.length === 0) {
    return;
  }

  const command = config.selectedCommands[0];

  if (!cleanText(command)) {
    return;
  }

  typeLine({
    label: "09:01",
    category: "COMMAND",
    text: `Comando selezionato da terminal.clochardcoin.it: “${command}”`
  });

  setTimeout(() => {
    typeLine({
      label: "09:02",
      category: "MAT",
      text: "Lo userò come traccia della missione di oggi."
    });
  }, 1800);
}

async function typeLine({ label, category, text }) {
  if (!cleanText(text)) {
    return;
  }

  const line = document.createElement("p");
  line.className = "terminal-line cursor";

  if (category === "ERROR" || category === "REPORT") {
    line.classList.add("alert");
  }

  elements.terminal.appendChild(line);

  const fullText = `[${label}] [${category}] ${text}`;

  for (let i = 0; i <= fullText.length; i++) {
    line.innerHTML = formatTerminalLine(fullText.slice(0, i));
    elements.terminal.scrollTop = elements.terminal.scrollHeight;

    await sleep(18 + Math.random() * 26);
  }

  line.classList.remove("cursor");

  limitTerminalLines();
}

function formatTerminalLine(text) {
  const match = text.match(/^(\[[^\]]+\])\s(\[[^\]]+\])\s?(.*)$/);

  if (!match) {
    return escapeHtml(text);
  }

  const time = escapeHtml(match[1]);
  const category = escapeHtml(match[2]);
  const rest = escapeHtml(match[3]);

  return `<span class="time">${time}</span> <span class="category">${category}</span> ${rest}`;
}

function limitTerminalLines() {
  const maxLines = 16;

  while (elements.terminal.children.length > maxLines) {
    elements.terminal.removeChild(elements.terminal.firstChild);
  }
}

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function cleanText(value) {
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
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

function setupButtons() {
  elements.copyWalletBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(config.solanaWallet);
      showToast("Wallet copiato.");
    } catch (error) {
      showToast("Copia non riuscita. Tieni premuto sul wallet.");
    }
  });

  elements.donateBtn.addEventListener("click", () => {
    const encodedLabel = encodeURIComponent("Supporta Mat Clochard");
    const amount = String(config.minimumDonation || "0.01 SOL").replace(" SOL", "");

    const solanaPayUrl = `solana:${config.solanaWallet}?amount=${amount}&label=${encodedLabel}`;

    window.location.href = solanaPayUrl;

    setTimeout(() => {
      showToast("Se il wallet non si apre, copia il wallet e invia manualmente.");
    }, 800);
  });

  elements.toggleAudioBtn.addEventListener("click", async () => {
    if (!elements.ambientAudio) return;

    if (!audioEnabled) {
      try {
        elements.ambientAudio.volume = 0.22;
        await elements.ambientAudio.play();

        audioEnabled = true;
        elements.toggleAudioBtn.textContent = "Disattiva musica ambient";
        showToast("Musica ambient attivata.");
      } catch (error) {
        showToast("Audio non disponibile. Carica assets/ambient.mp3.");
      }

      return;
    }

    elements.ambientAudio.pause();
    audioEnabled = false;
    elements.toggleAudioBtn.textContent = "Attiva musica ambient";
    showToast("Musica ambient disattivata.");
  });
}

function setupMatFallback() {
  elements.matAvatar.addEventListener("error", () => {
    elements.matAvatar.style.display = "none";
    elements.matPlaceholder.style.display = "grid";
  });
}

setupButtons();
setupMatFallback();
loadConfig();