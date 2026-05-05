const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";
const COMMANDS_TABLE = "mat_commands";

const commandForm = document.getElementById("commandForm");
const nicknameInput = document.getElementById("nickname");
const commandInput = document.getElementById("command");
const rulesAccepted = document.getElementById("rulesAccepted");
const submitBtn = document.getElementById("submitBtn");
const successBox = document.getElementById("successBox");
const commandsList = document.getElementById("commandsList");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const charCount = document.getElementById("charCount");
const toast = document.getElementById("toast");

const LOCAL_KEY = "mat-local-commands";

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

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Prefer: "return=minimal"
  };
}

function getLocalCommands() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalCommand(item) {
  const commands = getLocalCommands();

  commands.unshift(item);

  localStorage.setItem(LOCAL_KEY, JSON.stringify(commands.slice(0, 10)));

  renderLocalCommands();
}

function renderLocalCommands() {
  if (!commandsList) return;

  const commands = getLocalCommands();

  if (!commands.length) {
    commandsList.innerHTML = `
      <div class="command-item">
        <strong>Nessun comando locale</strong>
        <p>I comandi inviati da questo dispositivo appariranno qui.</p>
      </div>
    `;
    return;
  }

  commandsList.innerHTML = "";

  commands.forEach((item) => {
    const div = document.createElement("div");
    div.className = "command-item";

    div.innerHTML = `
      <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
      <p>${escapeHtml(item.command)}</p>
      <small>${escapeHtml(item.created_at)} · stato: pending moderation</small>
    `;

    commandsList.appendChild(div);
  });
}

async function sendCommand(event) {
  event.preventDefault();

  const nickname = nicknameInput.value.trim() || "utente_anonimo";
  const command = commandInput.value.trim();

  if (!command) {
    showToast("Scrivi un comando per Mat.");
    return;
  }

  if (!rulesAccepted.checked) {
    showToast("Devi accettare le regole.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Invio...";

  try {
    const payload = {
      nickname,
      command,
      status: "pending"
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${COMMANDS_TABLE}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    saveLocalCommand({
      nickname,
      command,
      created_at: new Date().toLocaleString("it-IT")
    });

    commandForm.reset();

    if (charCount) {
      charCount.textContent = "0";
    }

    if (successBox) {
      successBox.classList.remove("hidden");

      setTimeout(() => {
        successBox.classList.add("hidden");
      }, 5000);
    }

    showToast("Comando inviato. Attende moderazione.");
  } catch (error) {
    console.error(error);
    showToast("Errore invio comando. Controlla Supabase.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia comando";
  }
}

commandInput.addEventListener("input", () => {
  if (charCount) {
    charCount.textContent = commandInput.value.length;
  }
});

commandForm.addEventListener("submit", sendCommand);

clearLocalBtn.addEventListener("click", () => {
  localStorage.removeItem(LOCAL_KEY);
  renderLocalCommands();
  showToast("Lista locale cancellata.");
});

renderLocalCommands();