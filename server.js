// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Usuários simulados
const users = {
  lucas: { password: '123456', balance: 0, history: [] },
  admin: { password: 'admin', balance: 0, history: [] }
};

// Autenticação simples via POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

  const user = users[username];
  if (!user || user.password !== password)
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });

  // Retorna saldo e histórico
  res.json({
    username,
    balance: user.balance,
    history: user.history
  });
});

// Depósito POST /deposit
app.post('/deposit', (req, res) => {
  const { username, amount } = req.body;
  if (!username || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Dados inválidos para depósito' });
  }
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  user.balance += amount;
  const transaction = { type: 'Depósito', amount, date: new Date().toISOString() };
  user.history.push(transaction);

  res.json({ balance: user.balance, transaction });
});

// Saque POST /withdraw
app.post('/withdraw', (req, res) => {
  const { username, amount } = req.body;
  if (!username || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Dados inválidos para saque' });
  }
  const user = users[username];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (amount > user.balance)
    return res.status(400).json({ error: 'Saldo insuficiente' });

  user.balance -= amount;
  const transaction = { type: 'Saque', amount, date: new Date().toISOString() };
  user.history.push(transaction);

  res.json({ balance: user.balance, transaction });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
