const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

module.exports = (req, res) => {
  db.get("SELECT saldo FROM wallet WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: "Erro ao consultar saldo." });
    res.status(200).json({ saldo: row ? row.saldo : 0 });
  });
};