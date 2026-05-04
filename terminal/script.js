const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";

const TABLE_NAME = "mat_commands";
const STORAGE_KEY = "mat-clochard-user-commands";

const form = document.getElementById("commandForm");
const nicknameInput = document.getElementById("nickname");
const commandInput = document.getElementById("command");
const rulesAccepted = document.getElementById("rulesAccepted");
const charCount = document.getElementById("charCount");
const successBox = document.getElementById("successBox");
const commandsList = document.getElementById("commandsList");
const clearLocalBtn = document.getElementById("clearLocalBtn");
const toast = document.getElementById("toast");
const submitBtn = document.getElementById("submitBtn");

let isSending = false;

function clean(value) {
  return String(value || "").trim();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getCommands() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCommands(commands) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function containsBlockedContent(text) {
  const blocked = [
    "password",
    "telefono",
    "indirizzo",
    "codice fiscale",
    "iban",
    "carta di credito",
    "numero carta",
    "documento",
    "residenza"
  ];

  const lower = text.toLowerCase();

  return blocked.some((word) => lower.includes(word));
}

async function sendCommandToSupabase({ nickname, command }) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      nickname,
      command,
      status: "pending",
      source: "terminal.clochardcoin.it"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Errore invio comando");
  }
}

function renderCommands() {
  const commands = getCommands();

  commandsList.innerHTML = "";

  if (commands.length === 0) {
    commandsList.innerHTML = `
      <div class="command-item">
        <strong>Nessun comando locale</strong>
        <p>Quando invii un comando, apparirà qui su questo dispositivo.</p>
      </div>
    `;
    return;
  }

  commands
    .slice()
    .reverse()
    .forEach((item) => {
      const div = document.createElement("div");
      div.className = "command-item";

      div.innerHTML = `
        <strong>@${escapeHtml(item.nickname || "utente_anonimo")}</strong>
        <p>${escapeHtml(item.command)}</p>
        <small>${escapeHtml(item.createdAt)} · stato: ${escapeHtml(item.status)}</small>
      `;

      commandsList.appendChild(div);
    });
}

commandInput.addEventListener("input", () => {
  charCount.textContent = commandInput.value.length;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSending) return;

  const nickname = clean(nicknameInput.value) || "utente_anonimo";
  const command = clean(commandInput.value);

  if (!command) {
    showToast("Scrivi un comando prima di inviare.");
    return;
  }

  if (command.length < 8) {
    showToast("Comando troppo corto. Scrivi qualcosa di più chiaro.");
    return;
  }

  if (command.length > 240) {
    showToast("Comando troppo lungo. Massimo 240 caratteri.");
    return;
  }

  if (nickname.length > 24) {
    showToast("Nickname troppo lungo. Massimo 24 caratteri.");
    return;
  }

  if (!rulesAccepted.checked) {
    showToast("Devi accettare le regole della community.");
    return;
  }

  if (containsBlockedContent(command)) {
    showToast("Evita dati personali o informazioni sensibili.");
    return;
  }

  isSending = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Invio in corso...";

  try {
    await sendCommandToSupabase({ nickname, command });

    const commands = getCommands();

    commands.push({
      nickname,
      command,
      createdAt: formatDate(new Date()),
      status: "pending"
    });

    saveCommands(commands);

    form.reset();
    charCount.textContent = "0";
    successBox.classList.remove("hidden");

    renderCommands();

    showToast("Comando inviato a Mat.");
  } catch (error) {
    console.error(error);
    showToast("Errore invio. Controlla tabella o policy Supabase.");
  } finally {
    isSending = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Invia comando";
  }
});

clearLocalBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderCommands();
  showToast("Lista locale cancellata.");
});

renderCommands();