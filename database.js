const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./wallet.db');

// Criação automática das tabelas se não existirem
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS saldo (
      id INTEGER PRIMARY KEY,
      valor REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT,
      valor REAL,
      data TEXT
    )
  `);

  // Garante que o saldo inicial exista
  db.get('SELECT COUNT(*) as count FROM saldo', (err, row) => {
    if (row.count === 0) {
      db.run('INSERT INTO saldo (valor) VALUES (0)');
    }
  });
});

// Pega o saldo atual
function pegarSaldo(callback) {
  db.get('SELECT valor FROM saldo WHERE id = 1', (err, row) => {
    if (err) return callback(err);
    callback(null, row ? row.valor : 0);
  });
}

// Atualiza o saldo para um novo valor
function atualizarSaldo(novoSaldo, callback) {
  db.run('UPDATE saldo SET valor = ? WHERE id = 1', [novoSaldo], callback);
}

// Adiciona uma transação (pix, saque, depósito, etc.)
function adicionarTransacao(tipo, valor, callback) {
  const data = new Date().toISOString();
  db.run(
    'INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, ?)',
    [tipo, valor, data],
    callback
  );
}

// Deposita um valor no saldo atual
function depositar(valor, callback) {
  pegarSaldo((err, saldo) => {
    if (err) return callback(err);
    const novoSaldo = saldo + valor;
    atualizarSaldo(novoSaldo, (err) => {
      if (err) return callback(err);
      adicionarTransacao('deposito', valor, callback);
    });
  });
}

// Saca um valor se o saldo for suficiente
function sacar(valor, callback) {
  pegarSaldo((err, saldo) => {
    if (err) return callback(err);
    if (valor > saldo) return callback(new Error("Saldo insuficiente"));
    const novoSaldo = saldo - valor;
    atualizarSaldo(novoSaldo, (err) => {
      if (err) return callback(err);
      adicionarTransacao('saque', valor, callback);
    });
  });
}

// Exporta funções
module.exports = {
  pegarSaldo,
  atualizarSaldo,
  adicionarTransacao,
  depositar,
  sacar
};
