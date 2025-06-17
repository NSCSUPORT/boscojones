// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cria banco SQLite na memória ou arquivo
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Conectado ao SQLite.');
});

// Cria tabela de usuários se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// Registro
app.post('/api/register', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha || senha.length < 6) {
    return res.status(400).json({ error: 'Email e senha (mínimo 6 caracteres) são obrigatórios.' });
  }

  // Hash da senha
  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Erro ao criptografar senha.' });

    // Insere no banco
    const query = `INSERT INTO users (email, password) VALUES (?, ?)`;
    db.run(query, [email, hash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Email já cadastrado.' });
        }
        return res.status(500).json({ error: 'Erro ao registrar usuário.' });
      }
      res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao consultar usuário.' });
    if (!row) return res.status(401).json({ error: 'Usuário não encontrado.' });

    // Compara senha
    bcrypt.compare(senha, row.password, (err, result) => {
      if (err) return res.status(500).json({ error: 'Erro ao verificar senha.' });
      if (!result) return res.status(401).json({ error: 'Senha incorreta.' });

      // Login OK
      res.json({ message: 'Login efetuado com sucesso!' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
