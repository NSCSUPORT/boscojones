const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const { valor } = req.body;
  db.run("UPDATE wallet SET saldo = saldo + ? WHERE id = 1", [valor], function(err) {
    if (err) return res.status(500).json({ error: "Erro ao depositar." });
    res.status(200).json({ success: true });
  });
};