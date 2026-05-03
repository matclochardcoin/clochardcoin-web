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
    "carta di credito"
  ];

  const lower = text.toLowerCase();

  return blocked.some((word) => lower.includes(word));
}

commandInput.addEventListener("input", () => {
  charCount.textContent = commandInput.value.length;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

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

  if (!rulesAccepted.checked) {
    showToast("Devi accettare le regole della community.");
    return;
  }

  if (containsBlockedContent(command)) {
    showToast("Evita dati personali o informazioni sensibili.");
    return;
  }

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

  showToast("Comando salvato su questo dispositivo.");
});

clearLocalBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderCommands();
  showToast("Lista locale cancellata.");
});

renderCommands();