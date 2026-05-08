const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const COMMANDS_TABLE = "mat_commands";
const CONFIG_TABLE = "mat_live_config";
const REPORTS_TABLE = "mat_reports_archive";
const CONFIG_ID = 1;
const ADMIN_PASSWORD = "MAT2026";

const ACTIVE_COMMAND_KEY = "mat-active-command";

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

async function loadLiveConfig() {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}?select=*&id=eq.${CONFIG_ID}&limit=1`;

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
  } catch (error) {
    console.error(error);
    showToast("Errore caricamento cervello live.");
  }
}

async function saveLiveConfig() {
  const selectedDate = getSelectedLiveDate();

  const payload = {
    id: CONFIG_ID,
    live_date: selectedDate,
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
    scheduled_logs: {},
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
    console.error(error);
    showToast("Errore salvataggio. Controlla colonne e policy Supabase.");
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
      `?select=id,nickname,command,status,created_at`;

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
    div.className = "command-item";

    div.innerHTML = `
      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
      <p>${escapeHtml(item.command)}</p>
      <small>${escapeHtml(item.created_at)} · stato: ${escapeHtml(item.status)}</small>

      <div class="actions" style="justify-content:flex-start;margin:12px 0 0;">
        <button type="button" data-action="approved" data-id="${escapeHtml(item.id)}">Approva</button>
        <button type="button" data-action="activate_mission" data-id="${escapeHtml(item.id)}" data-nickname="${escapeHtml(item.nickname || "utente_anonimo")}" data-command="${escapeHtml(item.command)}">Attiva Mat</button>
        <button type="button" data-action="use_mission" data-id="${escapeHtml(item.id)}" data-nickname="${escapeHtml(item.nickname || "utente_anonimo")}" data-command="${escapeHtml(item.command)}">Usa senza salvare</button>
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

    if (shouldReload) loadCommands();
  } catch (error) {
    console.error(error);
    showToast("Errore aggiornamento missione.");
  }
}

function activateMission(item) {
  if (!item || !item.command) {
    showToast("Missione non valida.");
    return;
  }

  saveActiveCommand(item);

  if (dailyObjective) dailyObjective.value = item.command;
  if (matStatus) matStatus.value = "ONLINE";
  if (matMode) matMode.value = "SCANNING";

  const currentEnergy = numberValue(matEnergy, 21);
  if (matEnergy) matEnergy.value = Math.max(5, currentEnergy - 3);

  if (matSolution) matSolution.value = "";

  showToast("Mat attivato. Ora salva il cervello live.");
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

  if (matStatus) matStatus.value = "ONLINE";
  if (matMode) matMode.value = "COMPLETED";

  const reportPayload = {
    command_id: Number(active.id),
    nickname: active.nickname || "utente_anonimo",
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

    if (dailyObjective) dailyObjective.value = "In attesa del prossimo comando";
    if (matMode) matMode.value = "COMPLETED";

    await saveLiveConfig();
    await loadCommands();

    clearActiveCommand();

    showToast("Soluzione pubblicata e report archiviato.");
  } catch (error) {
    console.error(error);
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

    const item = { id, nickname, command };

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
      return;
    }
  });
}

if (localStorage.getItem("mat-moderator-auth") === "true") {
  showModerator();
} else {
  showLogin();
}