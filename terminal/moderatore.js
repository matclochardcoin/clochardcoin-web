const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const TABLE_NAME = "mat_commands";
const ADMIN_PASSWORD = "MAT2026";

const loginBox = document.getElementById("loginBox");
const moderationBox = document.getElementById("moderationBox");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const moderationList = document.getElementById("moderationList");
const toast = document.getElementById("toast");

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

function showLogin() {
  loginBox.classList.remove("hidden");
  moderationBox.classList.add("hidden");
}

function showModerator() {
  loginBox.classList.add("hidden");
  moderationBox.classList.remove("hidden");
  loadCommands();
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
      `${SUPABASE_URL}/rest/v1/${TABLE_NAME}` +
      `?select=id,nickname,command,status,created_at` +
      `&status=eq.pending` +
      `&order=created_at.desc` +
      `&limit=50`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
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
        <p>Controlla le policy SELECT/UPDATE su Supabase.</p>
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
        <button type="button" data-action="blocked" data-id="${escapeHtml(item.id)}">Blocca</button>
      </div>
    `;

    moderationList.appendChild(div);
  });
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ status })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    showToast(status === "approved" ? "Comando approvato." : "Comando bloccato.");
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