const SUPABASE_URL = "https://krzidujoezrflrsfajxm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyemlkdWpvZXpyZmxyc2ZhanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDQzODksImV4cCI6MjA5MzQyMDM4OX0.hLD0OCzpi2fWQA8OlpoCWFk3dqTFLcVJSNVqaW9_ISQ";
const COMMANDS_TABLE = "mat_commands";

const nicknameInput = document.getElementById("nickname");
const commandInput = document.getElementById("command");
const sendBtn = document.getElementById("sendBtn");
const terminal = document.getElementById("terminal");
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

function writeTerminal(text) {
  if (!terminal) return;

  const line = document.createElement("p");
  line.innerHTML = escapeHtml(text);
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Prefer: "return=minimal"
  };
}

async function sendCommand() {
  const nickname = nicknameInput?.value.trim() || "utente_anonimo";
  const command = commandInput?.value.trim();

  if (!command) {
    showToast("Scrivi un comando per Mat.");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Invio...";

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

    writeTerminal(`> comando inviato da @${nickname}`);
    writeTerminal(`> stato: pending moderation`);
    writeTerminal(`> "${command}"`);

    commandInput.value = "";
    showToast("Comando inviato. Attende moderazione.");
  } catch (error) {
    console.error(error);
    showToast("Errore invio comando. Controlla Supabase.");
    writeTerminal("> errore: comando non inviato");
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Invia comando";
  }
}

function bootTerminal() {
  if (!terminal) return;

  terminal.innerHTML = "";
  writeTerminal("CLOCHARDCOIN TERMINAL");
  writeTerminal("MAT_AI // INPUT CHANNEL ONLINE");
  writeTerminal("--------------------------------");
  writeTerminal("> scrivi un comando per Mat");
  writeTerminal("> il comando entra in moderazione");
  writeTerminal("> se approvato, apparirà nella live");
}

sendBtn?.addEventListener("click", sendCommand);

commandInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendCommand();
  }
});

bootTerminal();