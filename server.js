// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = 3000;
const SECRET = "sua_chave_secreta_super_forte"; // troca para algo seguro

app.use(cors());
app.use(express.json());

// Cria ou abre o banco SQLite
const db = new sqlite3.Database("./usuarios.db");

// Cria tabela usuarios se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    senha TEXT
  )
`);

// Registro de usuário
app.post("/api/register", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: "Email e senha obrigatórios." });

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });

    const query = `INSERT INTO usuarios (email, senha) VALUES (?, ?)`;
    db.run(query, [email, hash], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email já cadastrado." });
        }
        return res.status(500).json({ error: "Erro ao registrar usuário." });
      }
      res.json({ message: "Usuário registrado com sucesso." });
    });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: "Email e senha obrigatórios." });

  db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (!user) return res.status(400).json({ error: "Usuário não encontrado." });

    bcrypt.compare(senha, user.senha, (err, valid) => {
      if (err) return res.status(500).json({ error: "Erro no servidor." });
      if (!valid) return res.status(400).json({ error: "Senha incorreta." });

      // Gera token JWT simples (expira em 1h)
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1h" });

      res.json({ message: "Login efetuado com sucesso.", token });
    });
  });
});

// Middleware para proteger rotas
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido." });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido." });

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido ou expirado." });
    req.user = decoded;
    next();
  });
}

// Exemplo de rota protegida
app.get("/api/profile", verificarToken, (req, res) => {
  res.json({ message: "Acesso liberado!", user: req.user });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
