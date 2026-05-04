const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function typeLine(text, speed = 35) {
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

async function main() {
  console.clear();

  await typeLine("CLOCHARDCOIN LIVE TERMINAL", 20);
  await typeLine("MAT_AI // ONLINE", 20);
  await typeLine("--------------------------------", 10);

  let shown = 0;

  while (true) {
    const logs = readLogs();

    for (let i = shown; i < logs.length; i++) {
      const log = logs[i];

      await typeLine(`[${log.date} | ${String(log.hour).padStart(2, "0")}:00]`, 25);
      await typeLine(`OBJECTIVE: ${log.objective}`, 25);
      await typeLine(`> ${log.message}`, 35);
      await typeLine("--------------------------------", 10);

      shown++;
    }

    await sleep(5000);
  }
}

main();
