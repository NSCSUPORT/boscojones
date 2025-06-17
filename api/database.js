const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./wallet.db');

// Criação das tabelas caso não existam
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS saldo (
    id INTEGER PRIMARY KEY,
    valor REAL NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    data TEXT NOT NULL
  )`);

  // Inicializa saldo com zero, se não existir
  db.get("SELECT COUNT(*) as count FROM saldo", (err, row) => {
    if (err) {
      console.error("Erro ao verificar saldo inicial:", err);
    } else if (row.count === 0) {
      db.run("INSERT INTO saldo (id, valor) VALUES (1, 0)");
    }
  });
});

module.exports = {
  pegarSaldo: (callback) => {
    db.get("SELECT valor FROM saldo WHERE id = 1", (err, row) => {
      if (err) return callback(err);
      callback(null, row ? row.valor : 0);
    });
  },

  atualizarSaldo: (novoValor, callback) => {
    db.run("UPDATE saldo SET valor = ? WHERE id = 1", [novoValor], (err) => {
      callback(err);
    });
  },

  depositar: (valor, callback) => {
    db.serialize(() => {
      db.get("SELECT valor FROM saldo WHERE id = 1", (err, row) => {
        if (err) return callback(err);
        const novoSaldo = (row ? row.valor : 0) + valor;
        db.run("UPDATE saldo SET valor = ? WHERE id = 1", [novoSaldo], (err2) => {
          if (err2) return callback(err2);
          const data = new Date().toISOString();
          db.run("INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, ?)", ['deposit', valor, data], (err3) => {
            callback(err3);
          });
        });
      });
    });
  },

  sacar: (valor, callback) => {
    db.serialize(() => {
      db.get("SELECT valor FROM saldo WHERE id = 1", (err, row) => {
        if (err) return callback(err);
        const saldoAtual = row ? row.valor : 0;
        if (valor > saldoAtual) return callback(new Error("Saldo insuficiente"));
        const novoSaldo = saldoAtual - valor;
        db.run("UPDATE saldo SET valor = ? WHERE id = 1", [novoSaldo], (err2) => {
          if (err2) return callback(err2);
          const data = new Date().toISOString();
          db.run("INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, ?)", ['withdraw', valor, data], (err3) => {
            callback(err3);
          });
        });
      });
    });
  },

  adicionarTransacao: (tipo, valor, callback) => {
    const data = new Date().toISOString();
    db.run("INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, ?)", [tipo, valor, data], (err) => {
      callback(err);
    });
  },

  pegarHistorico: (callback) => {
    db.all("SELECT * FROM transacoes ORDER BY data DESC LIMIT 50", (err, rows) => {
      callback(err, rows);
    });
  }
};
