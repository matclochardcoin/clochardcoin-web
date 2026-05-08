const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "INSERISCI_LA_TUA_SUPABASE_ANON_KEY";

const COMMANDS_TABLE = "mat_commands";
const CONFIG_TABLE = "mat_live_config";
const REPORTS_TABLE = "mat_reports_archive";
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
const moderationList = $("moderationList");
const missionFilter = $("missionFilter");
const toast = $("toast");

const matStatus = $("matStatus");
const matMode = $("matMode");
const matEnergy = $("matEnergy");
const liveDate = $("liveDate");
const dailyObjective = $("dailyObjective");

const activeCommandId = $("activeCommandId");
const activeNickname = $("activeNickname");
const activeCommand = $("activeCommand");
const matSolution = $("matSolution");
const publishSolutionBtn = $("publishSolutionBtn");

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

const ACTIVE_COMMAND_KEY = "mat-active-command";

const missionLabels = {
  news: "NOTIZIA",
  token: "TOKEN"
};

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
  setTimeout(() => toast.classList.remove("show"), 2600);
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

function getMissionType(item) {
  const value = String(item?.mission_type || "").toLowerCase();

  if (value === "token") return "token";
  if (value === "news") return "news";

  const command = String(item?.command || "").toLowerCase();

  if (command.includes("verifica token")) return "token";
  if (command.includes("token")) return "token";
  if (command.includes("contract")) return "token";
  if (command.includes("dexscreener")) return "token";
  if (command.includes("pump.fun")) return "token";
  if (command.includes("solscan")) return "token";

  return "news";
}

function getMissionBadge(item) {
  const type = getMissionType(item);
  return missionLabels[type] || "OSINT";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getSelectedLiveDate() {
  return liveDate?.value || todayIsoDate();
}

function numberValue(input, fallback = 0) {
  const value = Number(input?.value || fallback);
  return Number.isNaN(value) ? fallback : value;
}

function textValue(input, fallback = "") {
  return String(input?.value || fallback).trim();
}

function setTextAreaValue(node, value) {
  if (!node) return;
  node.value = value || "";
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

function getActiveCommand() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_COMMAND_KEY)) || null;
  } catch {
    return null;
  }
}

function saveActiveCommand(item) {
  localStorage.setItem(ACTIVE_COMMAND_KEY, JSON.stringify(item));
  fillActiveCommandFields(item);
}

function clearActiveCommand() {
  localStorage.removeItem(ACTIVE_COMMAND_KEY);
  fillActiveCommandFields(null);
  if (matSolution) matSolution.value = "";
}

function fillActiveCommandFields(item) {
  if (activeCommandId) activeCommandId.value = item?.id || "";
  if (activeNickname) activeNickname.value = item?.nickname || "";
  if (activeCommand) activeCommand.value = item?.command || "";
}

function restoreActiveCommand() {
  fillActiveCommandFields(getActiveCommand());
}

function showLogin() {
  if (loginBox) loginBox.classList.remove("hidden");
  if (moderationBox) moderationBox.classList.add("hidden");
}

function showModerator() {
  if (loginBox) loginBox.classList.add("hidden");
  if (moderationBox) moderationBox.classList.remove("hidden");

  restoreActiveCommand();
  loadLiveConfig();
  loadCommands();
}

function getLogText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.text || "";
  return "";
}

async function loadLiveConfig() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}?select=*&id=eq.${CONFIG_ID}&limit=1`;

    const response = await fetch(url, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const config = data[0];

    if (!config) {
      if (liveDate) liveDate.value = todayIsoDate();
      if (matStatus) matStatus.value = "ONLINE";
      if (matMode) matMode.value = "IDLE";
      if (matEnergy) matEnergy.value = 21;
      showToast("Config non trovata. Verrà creata al primo salvataggio.");
      return;
    }

    if (matStatus) matStatus.value = config.mat_status || "ONLINE";
    if (matMode) matMode.value = config.mat_mode || "IDLE";
    if (matEnergy) matEnergy.value = config.mat_energy ?? 21;
    if (liveDate) liveDate.value = config.live_date || todayIsoDate();
    if (dailyObjective) dailyObjective.value = config.daily_objective || "";

    if (instagramFollowers) instagramFollowers.value = config.instagram_followers ?? "";
    if (telegramFollowers) telegramFollowers.value = config.telegram_followers ?? "";
    if (tiktokFollowers) tiktokFollowers.value = config.tiktok_followers ?? "";
    if (youtubeStatus) youtubeStatus.value = config.youtube_status || "A BREVE";

    if (solanaWallet) solanaWallet.value = config.solana_wallet || "5sc1W9g5VVyBW9EhU5oYhhDF49K751mKjZWo92iemTji";
    if (minimumDonation) minimumDonation.value = config.minimum_donation || "0.01 SOL";

    if (instagramLink) instagramLink.value = config.instagram_link || "https://www.instagram.com/clochard_coin?igsh=ZGxnbGV1aWs3OGpr";
    if (telegramLink) telegramLink.value = config.telegram_link || "https://t.me/+2WX7IXU1CzBlNzc0";
    if (tiktokLink) tiktokLink.value = config.tiktok_link || "https://www.tiktok.com/@matt.clochard?_r=1&_t=ZN-9679EEU85TT";
    if (terminalLink) terminalLink.value = config.terminal_link || "https://www.clochardcoin.it/terminal/";
    if (liveLink) liveLink.value = config.live_link || "https://www.clochardcoin.it/live/";

    const logs = config.scheduled_logs || {};

    if (log06) log06.value = getLogText(logs["06"]);
    if (log09) log09.value = getLogText(logs["09"]);
    if (log12) log12.value = getLogText(logs["12"]);
    if (log15) log15.value = getLogText(logs["15"]);
    if (log18) log18.value = getLogText(logs["18"]);
    if (log20) log20.value = getLogText(logs["20"]);
  } catch (error) {
    console.error("Errore loadLiveConfig:", error);
    showToast("Errore caricamento cervello live.");
  }
}

async function saveLiveConfig() {
  const payload = {
    id: CONFIG_ID,
    live_date: getSelectedLiveDate(),
    daily_objective: textValue(dailyObjective, "In attesa del prossimo comando"),
    mat_status: textValue(matStatus, "ONLINE"),
    mat_mode: textValue(matMode, "IDLE"),
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
    terminal_link: textValue(terminalLink, "https://www.clochardcoin.it/terminal/"),
    live_link: textValue(liveLink, "https://www.clochardcoin.it/live/"),
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

    showToast("Cervello live salvato.");
  } catch (error) {
    console.error("Errore saveLiveConfig:", error);
    showToast("Errore salvataggio cervello live.");
  }
}

async function loadCommands() {
  if (!moderationList) return;

  const filter = missionFilter?.value || "pending";

  moderationList.innerHTML = `
    <div class="command-item">
      <strong>Caricamento...</strong>
      <p>Sto leggendo le missioni ${escapeHtml(filter)}.</p>
    </div>
  `;

  try {
    let url =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,mission_type,status,created_at`;

    if (filter !== "all") {
      url += `&status=eq.${encodeURIComponent(filter)}`;
    }

    url += `&order=created_at.desc&limit=80`;

    const response = await fetch(url, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) throw new Error(await response.text());

    const commands = await response.json();
    renderCommands(commands);
  } catch (error) {
    console.error("Errore loadCommands:", error);

    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Errore lettura Supabase</strong>
        <p>Controlla tabella mat_commands, policy SELECT e colonna mission_type.</p>
      </div>
    `;
  }
}

function renderCommands(commands) {
  if (!moderationList) return;

  moderationList.innerHTML = "";

  if (!commands.length) {
    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Nessuna missione trovata</strong>
        <p>Cambia filtro o attendi nuovi segnali dalla community.</p>
      </div>
    `;
    return;
  }

  commands.forEach((item) => {
    const div = document.createElement("div");
    div.className = `command-item mission-${getMissionType(item)}`;

    div.innerHTML = `
      <div class="mission-badge">${escapeHtml(getMissionBadge(item))}</div>

      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>

      <p>${linkifyText(item.command)}</p>

      <small>${escapeHtml(item.created_at)} · stato: ${escapeHtml(item.status)}</small>

      <div class="actions" style="justify-content:flex-start;margin:12px 0 0;">
        <button type="button" data-action="approved" data-id="${escapeHtml(item.id)}">Approva</button>

        <button
          type="button"
          data-action="activate_mission"
          data-id="${escapeHtml(item.id)}"
          data-nickname="${escapeHtml(item.nickname || "utente_anonimo")}"
          data-command="${escapeHtml(item.command)}"
          data-mission-type="${escapeHtml(getMissionType(item))}"
        >
          Attiva Mat
        </button>

        <button
          type="button"
          data-action="use_mission"
          data-id="${escapeHtml(item.id)}"
          data-nickname="${escapeHtml(item.nickname || "utente_anonimo")}"
          data-command="${escapeHtml(item.command)}"
          data-mission-type="${escapeHtml(getMissionType(item))}"
        >
          Usa come missione
        </button>

        <button type="button" data-action="rejected" data-id="${escapeHtml(item.id)}">Rifiuta</button>
      </div>
    `;

    moderationList.appendChild(div);
  });
}

async function updateStatus(id, status, shouldReload = true) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({ status })
      }
    );

    if (!response.ok) throw new Error(await response.text());

    if (shouldReload) await loadCommands();
  } catch (error) {
    console.error("Errore updateStatus:", error);
    showToast("Errore aggiornamento missione.");
  }
}

function activateMission(item) {
  if (!item || !item.command) {
    showToast("Missione non valida.");
    return;
  }

  const missionType = getMissionType(item);
  const missionBadge = getMissionBadge(item);

  saveActiveCommand({
    id: item.id,
    nickname: item.nickname,
    command: item.command,
    mission_type: missionType
  });

  if (dailyObjective) dailyObjective.value = item.command;
  if (matStatus) matStatus.value = "ONLINE";
  if (matMode) matMode.value = "SCANNING";

  const currentEnergy = numberValue(matEnergy, 21);
  if (matEnergy) matEnergy.value = Math.max(5, currentEnergy - 3);

  if (log06) {
    setTextAreaValue(log06, "MAT CLOCHARD LIVE NODE ONLINE.");
  }

  if (log09) {
    setTextAreaValue(
      log09,
      `COMANDO OSINT RICEVUTO [${missionBadge}] da @${item.nickname}: "${item.command}". Mat si attiva.`
    );
  }

  if (log12) {
    setTextAreaValue(
      log12,
      `SCANSIONE ATTIVA [${missionBadge}]: Mat raccoglie fonti pubbliche, segnali, contesto e possibili anomalie.`
    );
  }

  if (log15) setTextAreaValue(log15, "");
  if (log18) setTextAreaValue(log18, "");
  if (log20) setTextAreaValue(log20, "");

  if (matSolution) matSolution.value = "";

  showToast(`Mat attivato su ${missionBadge}. Ora salva il cervello live.`);
}

async function activateMissionAndSave(item) {
  await updateStatus(item.id, "approved", false);
  activateMission(item);
  await saveLiveConfig();
  await loadCommands();

  showToast("Missione approvata. Mat è in SCANNING.");
}

async function publishSolution() {
  const active = getActiveCommand();
  const solution = textValue(matSolution);

  if (!active || !active.id || !active.command) {
    showToast("Nessun comando attivo da archiviare.");
    return;
  }

  if (!solution) {
    showToast("Scrivi prima la soluzione di Mat.");
    return;
  }

  const missionType = getMissionType(active);
  const missionBadge = getMissionBadge(active);

  if (matStatus) matStatus.value = "ONLINE";
  if (matMode) matMode.value = "COMPLETED";

  const reportText = `REPORT ${missionBadge} COMPLETATO per @${active.nickname}: ${solution}`;

  if (log20) {
    setTextAreaValue(log20, reportText);
  }

  const reportPayload = {
    command_id: Number(active.id),
    nickname: active.nickname,
    command: active.command,
    mat_solution: solution,
    mat_status: textValue(matStatus, "ONLINE"),
    mat_mode: "COMPLETED",
    mat_energy: Math.max(0, Math.min(100, numberValue(matEnergy, 21)))
  };

  try {
    const archiveResponse = await fetch(`${SUPABASE_URL}/rest/v1/${REPORTS_TABLE}`, {
      method: "POST",
      headers: supabaseHeaders({
        Prefer: "return=minimal"
      }),
      body: JSON.stringify(reportPayload)
    });

    if (!archiveResponse.ok) throw new Error(await archiveResponse.text());

    await updateStatus(active.id, "completed", false);
    await saveLiveConfig();
    await loadCommands();

    clearActiveCommand();

    showToast("Soluzione pubblicata e report archiviato.");
  } catch (error) {
    console.error("Errore publishSolution:", error);
    showToast("Errore archivio report. Controlla mat_reports_archive.");
  }
}

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const password = adminPassword?.value.trim();

    if (password !== ADMIN_PASSWORD) {
      showToast("Password errata.");
      return;
    }

    localStorage.setItem("mat-moderator-auth", "true");
    showToast("Accesso riuscito.");
    showModerator();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mat-moderator-auth");
    showLogin();
  });
}

if (refreshBtn) refreshBtn.addEventListener("click", loadCommands);
if (missionFilter) missionFilter.addEventListener("change", loadCommands);
if (saveLiveConfigBtn) saveLiveConfigBtn.addEventListener("click", saveLiveConfig);
if (publishSolutionBtn) publishSolutionBtn.addEventListener("click", publishSolution);

if (moderationList) {
  moderationList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const nickname = button.dataset.nickname || "utente_anonimo";
    const command = button.dataset.command || "";
    const mission_type = button.dataset.missionType || "news";

    const item = { id, nickname, command, mission_type };

    if (action === "approved" || action === "rejected") {
      await updateStatus(id, action);
      showToast(action === "approved" ? "Missione approvata." : "Missione rifiutata.");
      return;
    }

    if (action === "activate_mission") {
      await activateMissionAndSave(item);
      return;
    }

    if (action === "use_mission") {
      activateMission(item);
    }
  });
}

if (localStorage.getItem("mat-moderator-auth") === "true") {
  showModerator();
} else {
  showLogin();
}