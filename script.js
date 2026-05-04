const fs = require("fs");

const now = new Date();
const currentHour = now.getHours();
const date = now.toLocaleDateString("it-IT");

let objective = "Continuare a costruire";

try {
  const obj = JSON.parse(fs.readFileSync("./objective.json"));
  objective = obj.objective;
} catch (e) {}

const timeline = [
  { hour: 6, message: "Mat è stato attivato. Inizio operazioni." },
  { hour: 9, message: "Mat raccoglie dati dal mondo reale." },
  { hour: 12, message: "Mat analizza informazioni e pattern." },
  { hour: 15, message: "Mat costruisce connessioni nel sistema." },
  { hour: 18, message: "Mat espande la presenza digitale." },
  { hour: 20, message: "Mat chiude il ciclo e salva i risultati." }
];

// trova il blocco giusto in base all'ora
let selected = timeline[0];

for (let i = 0; i < timeline.length; i++) {
  if (currentHour >= timeline[i].hour) {
    selected = timeline[i];
  }
}

const logEntry = {
  date,
  hour: selected.hour,
  objective,
  message: selected.message
};

// leggiamo log esistente (array)
let logs = [];

try {
  logs = JSON.parse(fs.readFileSync("./logs.json"));
} catch (e) {}

// aggiungiamo nuovo log
logs.push(logEntry);

// salviamo tutto
fs.writeFileSync("./logs.json", JSON.stringify(logs, null, 2));

console.log("Log aggiunto:", logEntry);
