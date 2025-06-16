const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexão Supabase (PostgreSQL)
const pool = new Pool({
  connectionString: "postgresql://postgres:<SENHA>@db.latvlqeqjtlawtzmgzjb.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

// Fibonacci
function fibonacci(n) {
  if (n <= 1) return 1;
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

// Rotas
app.post("/register", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query("INSERT INTO wallet_users (email, senha) VALUES ($1, $2) RETURNING id", [email, senha]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: "Email já cadastrado" });
  }
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  const result = await pool.query("SELECT * FROM wallet_users WHERE email = $1 AND senha = $2", [email, senha]);
  if (result.rows.length > 0) {
    res.json({ success: true, saldo: result.rows[0].saldo });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

app.get("/saldo/:email", async (req, res) => {
  const { email } = req.params;
  const result = await pool.query("SELECT saldo FROM wallet_users WHERE email = $1", [email]);
  if (result.rows.length > 0) {
    res.json({ saldo: result.rows[0].saldo });
  } else {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

app.post("/depositar", async (req, res) => {
  const { email, valor, geminidade } = req.body;
  const taxaFixa = 0.05;
  const taxaGem = geminidade / 100;
  const valorTotal = valor - (valor * taxaFixa) - (valor * taxaGem);
  try {
    await pool.query("UPDATE wallet_users SET saldo = saldo + $1 WHERE email = $2", [valorTotal, email]);
    res.json({ sucesso: true, depositado: valorTotal.toFixed(2) });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao depositar" });
  }
});

app.post("/sacar", async (req, res) => {
  const { email, valor, ativoIndex } = req.body;
  const valorFib = valor * fibonacci(ativoIndex); // valorização Fibonacci
  try {
    const result = await pool.query("SELECT saldo FROM wallet_users WHERE email = $1", [email]);
    const saldoAtual = parseFloat(result.rows[0].saldo);
    if (saldoAtual >= valorFib) {
      await pool.query("UPDATE wallet_users SET saldo = saldo - $1 WHERE email = $2", [valorFib, email]);
      res.json({
        sucesso: true,
        aviso: "Saque confirmado com valorização via Fibonacci. Será processado em até 24 horas.",
        valorSacado: valorFib.toFixed(2)
      });
    } else {
      res.status(400).json({ erro: "Saldo insuficiente com valorização." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao sacar" });
  }
});

app.listen(port, () => {
  console.log(`💰 Wallet API em http://localhost:${port}`);
});
