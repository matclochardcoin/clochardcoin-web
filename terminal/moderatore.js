const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoia3J6aWR1am9lenJmbHJzZmFqeG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3Nzg0NDM4OSwiZXhwIjoyMDkzNDIwMzg5fQ.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

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
const missionFilter = $("missionFilter");
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

function setTextAreaValue(node, value) {
  if (!node) return;
  node.value = value || "";
}

function appendLine(current, line) {
  const base = String(current || "").trim();
  return base ? `${base}\n${line}` : line;
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
  if (loginBox) loginBox.classList.remove("hidden");
  if (moderationBox) moderationBox.classList.add("hidden");
}

function showModerator() {
  if (loginBox) loginBox.classList.add("hidden");
  if (moderationBox) moderationBox.classList.remove("hidden");

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
      if (matEnergy) matEnergy.value = 21;
      showToast("Config non trovata. Verrà creata al primo salvataggio.");
      return;
    }

    if (matStatus) matStatus.value = config.mat_status || "ONLINE";
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
    console.error(error);
    showToast("Errore caricamento cervello live.");
  }
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
        <button type="button" data-action="approve_live" data-id="${escapeHtml(item.id)}" data-command="${escapeHtml(item.command)}">Approva + live</button>
        <button type="button" data-action="use_mission" data-command="${escapeHtml(item.command)}">Usa come missione</button>
        <button type="button" data-action="auto_logs" data-command="${escapeHtml(item.command)}">Genera log</button>
        <button type="button" data-action="add_log12" data-command="${escapeHtml(item.command)}">Log 12</button>
        <button type="button" data-action="add_log15" data-command="${escapeHtml(item.command)}">Log 15</button>
        <button type="button" data-action="add_log18" data-command="${escapeHtml(item.command)}">Log 18</button>
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

    showToast(status === "approved" ? "Missione approvata." : "Missione rifiutata.");

    if (shouldReload) loadCommands();
  } catch (error) {
    console.error(error);
    showToast("Errore aggiornamento missione.");
  }
}

function appendToLog(textarea, command, prefix) {
  if (!textarea) return;

  textarea.value = appendLine(textarea.value, `${prefix}: ${command}`);
  showToast("Missione aggiunta al log. Premi Salva cervello live.");
}

function useAsMission(command) {
  if (!dailyObjective) return;

  dailyObjective.value = command;

  if (matStatus) matStatus.value = "SCANNING";

  const currentEnergy = numberValue(matEnergy, 21);
  if (matEnergy) matEnergy.value = Math.max(5, currentEnergy - 3);

  showToast("Missione impostata. Premi Salva cervello live.");
}

function generateLogsFromMission(command) {
  const mission = String(command || "").trim();

  if (!mission) {
    showToast("Missione vuota.");
    return;
  }

  if (log09) {
    setTextAreaValue(
      log09,
      `Segnale community approvato. Mat riceve una nuova missione: "${mission}".`
    );
  }

  if (log12) {
    setTextAreaValue(
      log12,
      `SCAN operativo avviato. Mat divide la missione in fonti, segnali e possibili risultati verificabili.`
    );
  }

  if (log15) {
    setTextAreaValue(
      log15,
      `Primo risultato parziale. Mat organizza ciò che ha trovato e separa dati utili, rumore e piste da verificare.`
    );
  }

  if (log18) {
    setTextAreaValue(
      log18,
      `Mat riflette sulla missione: non basta trovare risposte veloci, serve capire cosa è davvero utile alla community.`
    );
  }

  if (log20) {
    setTextAreaValue(
      log20,
      `REPORT finale. Missione analizzata: "${mission}". I segnali utili vengono salvati nella memoria di Mat e preparati per il prossimo ciclo.`
    );
  }

  showToast("Log automatici generati. Premi Salva cervello live.");
}

async function approveAndSendLive(id, command) {
  await updateStatus(id, "approved", false);

  useAsMission(command);
  generateLogsFromMission(command);

  await saveLiveConfig();
  await loadCommands();

  showToast("Missione approvata, log generati e live aggiornata.");
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
if (saveArchiveBtn) saveArchiveBtn.addEventListener("click", saveArchive);

if (moderationList) {
  moderationList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const command = button.dataset.command || "";

    if (action === "approved" || action === "rejected") {
      updateStatus(id, action);
      return;
    }

    if (action === "approve_live") {
      approveAndSendLive(id, command);
      return;
    }

    if (action === "use_mission") {
      useAsMission(command);
      return;
    }

    if (action === "auto_logs") {
      generateLogsFromMission(command);
      return;
    }

    if (action === "add_log12") {
      appendToLog(log12, command, "SCAN community");
      return;
    }

    if (action === "add_log15") {
      appendToLog(log15, command, "Risultato da missione community");
      return;
    }

    if (action === "add_log18") {
      appendToLog(log18, command, "Pensiero Mat sulla missione");
    }
  });
}

if (localStorage.getItem("mat-moderator-auth") === "true") {
  showModerator();
} else {
  showLogin();
}