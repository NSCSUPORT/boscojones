const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS wallet (id INTEGER PRIMARY KEY, saldo REAL)");
  db.get("SELECT * FROM wallet WHERE id = 1", (err, row) => {
    if (!row) {
      db.run("INSERT INTO wallet (id, saldo) VALUES (1, 0)");
    }
  });
});

module.exports = db;