// lan.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware para permitir requisições do frontend (CORS)
app.use(cors());

// Middleware para parsear JSON no body
app.use(express.json());

// Simulação banco de dados em memória
const users = {}; // { username: { password: '...', balance: 0, transactions: [] } }

// Endpoint registro
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }
  if (users[username]) {
    return res.status(409).json({ error: 'Usuário já existe.' });
  }
  users[username] = { password, balance: 0, transactions: [] };
  res.json({ message: 'Conta criada com sucesso!' });
});

// Endpoint login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }
  res.json({ message: 'Login bem-sucedido.' });
});

// Consultar saldo e histórico
app.get('/wallet/:username', (req, res) => {
  const username = req.params.username;
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ balance: user.balance, transactions: user.transactions });
});

// Depositar
app.post('/wallet/:username/deposit', (req, res) => {
  const username = req.params.username;
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido.' });

  const user = users[username];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  user.balance += amount;
  user.transactions.push({ type: 'Depósito', amount, date: new Date().toISOString() });

  res.json({ message: 'Depósito realizado.', balance: user.balance });
});

// Sacar
app.post('/wallet/:username/withdraw', (req, res) => {
  const username = req.params.username;
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido.' });

  const user = users[username];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  if (user.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente.' });

  user.balance -= amount;
  user.transactions.push({ type: 'Saque', amount, date: new Date().toISOString() });

  res.json({ message: 'Saque realizado.', balance: user.balance });
});

app.listen(port, () => {
  console.log(`Servidor lan.js rodando em http://localhost:${port}`);
});
