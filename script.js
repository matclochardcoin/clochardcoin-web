const fs = require("fs");

const now = new Date();
const hour = now.getHours();
const date = now.toLocaleDateString("it-IT");

let objective = "Continuare a costruire";

try {
  const obj = JSON.parse(fs.readFileSync("./objective.json"));
  objective = obj.objective;
} catch (e) {}

let message = "";

if (hour < 9) {
  message = "Mat è stato attivato. Inizio operazioni.";
} else if (hour < 12) {
  message = "Mat sta raccogliendo dati dalla rete.";
} else if (hour < 15) {
  message = "Mat analizza le informazioni.";
} else if (hour < 18) {
  message = "Mat costruisce connessioni.";
} else if (hour < 20) {
  message = "Mat espande la presenza.";
} else {
  message = "Mat chiude il ciclo giornaliero.";
}

const log = {
  date,
  hour,
  objective,
  message
};

fs.writeFileSync("./log.json", JSON.stringify(log, null, 2));

console.log("Log aggiornato:", log);
