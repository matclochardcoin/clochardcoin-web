const fs = require("fs");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function typeLine(text, speed = 25) {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(speed);
  }
  process.stdout.write("\n");
}

function readLogs() {
  try {
    return JSON.parse(fs.readFileSync("./logs.json", "utf8"));
  } catch {
    return [];
  }
}

async function boot() {
  console.clear();
  await typeLine("CLOCHARDCOIN LIVE TERMINAL", 15);
  await typeLine("MAT_AI // ONLINE", 15);
  await typeLine("--------------------------------", 10);
}

async function main() {
  await boot();

  let shown = 0;

  while (true) {
    const logs = readLogs();

    // stampa nuovi log
    for (let i = shown; i < logs.length; i++) {
      const log = logs[i];

      await typeLine(`[${log.date} | ${String(log.hour).padStart(2, "0")}:00]`, 20);
      await typeLine(`OBJECTIVE: ${log.objective}`, 20);
      await typeLine(`> ${log.message}`, 30);
      await typeLine("--------------------------------", 10);

      shown++;
    }

    // se non ci sono nuovi log → simula attività
    if (logs.length === shown) {
      const fake = [
        "scanning network...",
        "collecting signals...",
        "processing data...",
        "waiting input..."
      ];

      const msg = fake[Math.floor(Math.random() * fake.length)];
      await typeLine(`> ${msg}`, 15);
    }

    await sleep(4000);
  }
}

main();
