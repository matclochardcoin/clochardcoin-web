const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginBox = document.getElementById("loginBox");
const moderationBox = document.getElementById("moderationBox");
const emailInput = document.getElementById("email");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const moderationList = document.getElementById("moderationList");
const toast = document.getElementById("toast");

function showToast(message) {
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

async function checkSession() {
  const { data } = await client.auth.getSession();

  if (data.session) {
    loginBox.classList.add("hidden");
    moderationBox.classList.remove("hidden");
    await loadCommands();
  } else {
    loginBox.classList.remove("hidden");
    moderationBox.classList.add("hidden");
  }
}

async function login() {
  const email = emailInput.value.trim();

  if (!email) {
    showToast("Inserisci email.");
    return;
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    showToast("Errore invio magic link.");
    console.error(error);
    return;
  }

  showToast("Magic link inviato. Controlla email.");
}

async function logout() {
  await client.auth.signOut();
  await checkSession();
}

async function loadCommands() {
  moderationList.innerHTML = `
    <div class="command-item">
      <strong>Caricamento...</strong>
      <p>Sto leggendo i comandi in attesa.</p>
    </div>
  `;

  const { data, error } = await client
    .from("mat_commands")
    .select("id,nickname,command,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Errore</strong>
        <p>Non riesco a leggere i comandi. Controlla le policy Supabase.</p>
      </div>
    `;
    console.error(error);
    return;
  }

  if (!data.length) {
    moderationList.innerHTML = `
      <div class="command-item">
        <strong>Nessun comando pending</strong>
        <p>Quando gli utenti scriveranno nuovi comandi, appariranno qui.</p>
      </div>
    `;
    return;
  }

  moderationList.innerHTML = "";

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "command-item";

    div.innerHTML = `
      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
      <p>${escapeHtml(item.command)}</p>
      <small>${escapeHtml(item.created_at)} · stato: ${escapeHtml(item.status)}</small>

      <div class="actions" style="justify-content:flex-start;margin:12px 0 0;">
        <button type="button" data-action="approved" data-id="${escapeHtml(item.id)}">
          Approva
        </button>
        <button type="button" data-action="blocked" data-id="${escapeHtml(item.id)}">
          Blocca
        </button>
      </div>
    `;

    moderationList.appendChild(div);
  });
}

async function updateStatus(id, status) {
  const { error } = await client
    .from("mat_commands")
    .update({ status })
    .eq("id", id);

  if (error) {
    showToast("Errore aggiornamento comando.");
    console.error(error);
    return;
  }

  showToast(status === "approved" ? "Comando approvato." : "Comando bloccato.");
  await loadCommands();
}

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
refreshBtn.addEventListener("click", loadCommands);

moderationList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  await updateStatus(button.dataset.id, button.dataset.action);
});

checkSession();