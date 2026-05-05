const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const COMMANDS_TABLE = "mat_commands";
const CONFIG_TABLE = "mat_live_config";
const CONFIG_ID = 1;
const ADMIN_PASSWORD = "MAT2026";

const loginBox = document.getElementById("loginBox");
const moderationBox = document.getElementById("moderationBox");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const saveLiveConfigBtn = document.getElementById("saveLiveConfigBtn");
const moderationList = document.getElementById("moderationList");
const toast = document.getElementById("toast");

const dailyObjective = document.getElementById("dailyObjective");
const instagramFollowers = document.getElementById("instagramFollowers");
const telegramFollowers = document.getElementById("telegramFollowers");
const tiktokFollowers = document.getElementById("tiktokFollowers");

const log06 = document.getElementById("log06");
const log09 = document.getElementById("log09");
const log12 = document.getElementById("log12");
const log15 = document.getElementById("log15");
const log18 = document.getElementById("log18");
const log20 = document.getElementById("log20");

function showToast(message) {
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function supabaseHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra
  };
}

function showLogin() {
  loginBox.classList.remove("hidden");
  moderationBox.classList.add("hidden");
}

function showModerator() {
  loginBox.classList.add("hidden");
  moderationBox.classList.remove("hidden");
  loadLiveConfig();
  loadCommands();
}

async function loadLiveConfig() {
  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${CONFIG_TABLE}` +
      `?select=*` +
      `&id=eq.${CONFIG_ID}` +
      `&limit=1`;

    const response = await fetch(url, {
      headers: supabaseHeaders()
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const config = data[0];

    if (!config) {
      showToast("Config live non trovata. Verrà creata al primo salvataggio.");
      return;
    }

    dailyObjective.value = config.daily_objective || "";
    instagramFollowers.value = config.instagram_followers ?? "";
    telegramFollowers.value = config.telegram_followers ?? "";
    tiktokFollowers.value = config.tiktok_followers ?? "";

    const logs = config.scheduled_logs || {};

    log06.value = logs["06"] || "";
    log09.value = logs["09"] || "";
    log12.value = logs["12"] || "";
    log15.value = logs["15"] || "";
    log18.value = logs["18"] || "";
    log20.value = logs["20"] || "";
  } catch (error) {
    console.error(error);
    showToast("Errore caricamento config live.");
  }
}

async function saveLiveConfig() {
  const payload = {
    id: CONFIG_ID,
    daily_objective: dailyObjective.value.trim(),
    instagram_followers: Number(instagramFollowers.value || 0),
    telegram_followers: Number(telegramFollowers.value || 0),
    tiktok_followers: Number(tiktokFollowers.value || 0),
    scheduled_logs: {
      "06": log06.value.trim(),
      "09": log09.value.trim(),
      "12": log12.value.trim(),
      "15": log15.value.trim(),
      "18": log18.value.trim(),
      "20": log20.value.trim()
    },
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

    if (!response.ok) {
      throw new Error(await response.text());
    }

    showToast("Configurazione live salvata.");
  } catch (error) {
    console.error(error);
    showToast("Errore salvataggio config. Controlla tabella e policy Supabase.");
  }
}

async function loadCommands() {
  moderationList.innerHTML = `
    <div class="command-item">
      <strong>Caricamento...</strong>
      <p>Sto leggendo i comandi pending.</p>
    </div>
  `;

  try {
    const url =
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}` +
      `?select=id,nickname,command,status,created_at` +
      `&status=eq.pending` +
      `&order=created_at.desc` +
      `&limit=50`;

    const response = await fetch(url, {
      headers: supabaseHeaders()
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

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
  moderationList.innerHTML = "";

  if (!commands.length) {
    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Nessun comando pending</strong>
        <p>Quando gli utenti inviano nuovi comandi, appariranno qui.</p>
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
        <button type="button" data-action="rejected" data-id="${escapeHtml(item.id)}">Rifiuta</button>
      </div>
    `;

    moderationList.appendChild(div);
  });
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({
          Prefer: "return=minimal"
        }),
        body: JSON.stringify({ status })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    showToast(status === "approved" ? "Comando approvato." : "Comando rifiutato.");
    loadCommands();
  } catch (error) {
    console.error(error);
    showToast("Errore aggiornamento comando.");
  }
}

loginBtn.addEventListener("click", () => {
  const password = adminPassword.value.trim();

  if (password !== ADMIN_PASSWORD) {
    showToast("Password errata.");
    return;
  }

  localStorage.setItem("mat-moderator-auth", "true");
  showToast("Accesso riuscito.");
  showModerator();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("mat-moderator-auth");
  showLogin();
});

refreshBtn.addEventListener("click", loadCommands);
saveLiveConfigBtn.addEventListener("click", saveLiveConfig);

moderationList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  updateStatus(button.dataset.id, button.dataset.action);
});

if (localStorage.getItem("mat-moderator-auth") === "true") {
  showModerator();
} else {
  showLogin();
}