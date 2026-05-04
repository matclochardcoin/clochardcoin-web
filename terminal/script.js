async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeLine(element, text, speed = 20) {
  for (let char of text) {
    element.innerHTML += char;
    await sleep(speed);
  }
  element.innerHTML += "<br>";
}

async function loadLogs() {
  try {
    const res = await fetch("../logs.json?cache=" + Date.now());
    return await res.json();
  } catch {
    return [];
  }
}

async function runTerminal() {
  const terminal = document.getElementById("terminal");

  terminal.innerHTML = "";

  await typeLine(terminal, "CLOCHARDCOIN LIVE TERMINAL", 10);
  await typeLine(terminal, "MAT_AI // ONLINE", 10);
  await typeLine(terminal, "--------------------------------", 5);

  let shown = 0;

  while (true) {
    const logs = await loadLogs();

    for (let i = shown; i < logs.length; i++) {
      const log = logs[i];

      await typeLine(terminal, `[${log.date} | ${String(log.hour).padStart(2, "0")}:00]`, 15);
      await typeLine(terminal, `OBJECTIVE: ${log.objective}`, 15);
      await typeLine(terminal, `> ${log.message}`, 20);
      await typeLine(terminal, "--------------------------------", 5);

      terminal.scrollTop = terminal.scrollHeight;

      shown++;
    }

    if (logs.length === shown) {
      const fake = [
        "scanning network...",
        "collecting signals...",
        "processing data...",
        "waiting input..."
      ];

      const msg = fake[Math.floor(Math.random() * fake.length)];
      await typeLine(terminal, `> ${msg}`, 10);
    }

    await sleep(4000);
  }
}

runTerminal();
