const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'wallet.db'), (err) => {
  if (err) console.error('Erro ao conectar ao banco:', err);
  else console.log('Banco conectado.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    senha TEXT
  )
`);

module.exports = db;
