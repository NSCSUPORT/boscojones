// lan.js
const http = require('http');

const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bosco Jones Wallet - Login, Registro & Wallet</title>
<style>
  /* Reset básico e fontes */
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background-color: #0d1117; /* preto estilo GitHub */
    color: #c9d1d9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  main {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .container {
    background: #161b22;
    padding: 2rem;
    border-radius: 10px;
    width: 360px;
    box-shadow: 0 0 15px #238636cc;
  }
  input[type="text"],
  input[type="password"],
  input[type="number"] {
    width: 100%;
    padding: 0.8rem;
    margin: 0.6rem 0;
    border-radius: 6px;
    border: 1px solid #30363d;
    background: #0d1117;
    color: #c9d1d9;
    font-size: 1rem;
    outline-offset: 2px;
  }
  input[type="text"]:focus,
  input[type="password"]:focus,
  input[type="number"]:focus {
    border-color: #238636;
    outline: none;
  }
  button {
    width: 100%;
    padding: 0.8rem;
    margin-top: 1rem;
    border: none;
    border-radius: 6px;
    background: #238636;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  button:hover {
    background: #2ea043;
  }
  h2 {
    margin-bottom: 1rem;
    font-weight: 700;
    text-align: center;
  }
  #message {
    margin-top: 1rem;
    text-align: center;
    font-weight: 600;
  }
  .wallet-header {
    text-align: center;
    margin-bottom: 1rem;
  }
  .balance {
    font-size: 2.5rem;
    font-weight: 700;
    color: #58a6ff;
    margin-bottom: 0.3rem;
    font-family: 'Courier New', Courier, monospace;
  }
  .balance-fiat {
    font-size: 1.2rem;
    color: #8b949e;
    font-family: 'Courier New', Courier, monospace;
    margin-bottom: 1.5rem;
  }
  .btn-logout {
    background: #da3633;
    margin-top: 1rem;
  }
  .btn-logout:hover {
    background: #f85149;
  }
  form.transaction-form {
    margin-top: 1rem;
  }
  form.transaction-form label {
    display: block;
    margin-top: 0.6rem;
    font-weight: 600;
  }
  form.transaction-form input[type="number"] {
    margin-top: 0.3rem;
  }
  .history {
    margin-top: 1.5rem;
    max-height: 150px;
    overflow-y: auto;
    background: #0d1117;
    border: 1px solid #30363d;
    padding: 0.8rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #8b949e;
  }
  .history p {
    margin: 0.2rem 0;
  }
  footer {
    width: 100%;
    padding: 12px;
    background: linear-gradient(45deg, #f0f000, #ff4500);
    color: #000;
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 2px;
    text-shadow: 0 0 8px #ff0000;
    margin-top: auto;
    animation: neon 1.5s ease-in-out infinite alternate;
  }
  @keyframes neon {
    0% {
      text-shadow: 0 0 5px #f0f000, 0 0 10px #ff4500;
    }
    50% {
      text-shadow: 0 0 20px #ff4500, 0 0 30px #f0f000;
    }
    100% {
      text-shadow: 0 0 5px #f0f000, 0 0 10px #ff4500;
    }
  }
</style>
</head>
<body>

<main>
  <!-- Login form -->
  <section id="login-section" class="container">
    <h2>Login Bosco Jones Wallet</h2>
    <form id="login-form">
      <input type="text" id="username" placeholder="Usuário" required autocomplete="username" />
      <input type="password" id="password" placeholder="Senha" required autocomplete="current-password" />
      <button type="submit">Entrar</button>
    </form>
    <p style="text-align:center; margin-top:0.5rem;">
      Não tem conta? <a href="#" id="show-register" style="color:#58a6ff; cursor:pointer;">Registrar</a>
    </p>
    <div id="message"></div>
  </section>

  <!-- Register form -->
  <section id="register-section" class="container" style="display:none;">
    <h2>Registrar Conta</h2>
    <form id="register-form">
      <input type="text" id="reg-username" placeholder="Usuário" required autocomplete="username" />
      <input type="password" id="reg-password" placeholder="Senha" required autocomplete="new-password" />
      <button type="submit">Registrar</button>
    </form>
    <p style="text-align:center; margin-top:0.5rem;">
      Já tem conta? <a href="#" id="show-login" style="color:#58a6ff; cursor:pointer;">Entrar</a>
    </p>
    <div id="message-register"></div>
  </section>

  <!-- Wallet dashboard -->
  <section id="wallet-section" class="container" style="display:none;">
    <div class="wallet-header">
      <h2>Bem-vindo, <span id="user-display"></span>!</h2>
      <div class="balance" id="balance">B$ 0.00</div>
      <div class="balance-fiat" id="balance-fiat">USD 0.00</div>
    </div>

    <form id="deposit-form" class="transaction-form">
      <label for="deposit-amount">Depositar valor (B$):</label>
      <input type="number" id="deposit-amount" min="0.01" step="0.01" placeholder="Ex: 100.00" required />
      <button type="submit">Depositar</button>
    </form>

    <form id="withdraw-form" class="transaction-form">
      <label for="withdraw-amount">Sacar valor (B$):</label>
      <input type="number" id="withdraw-amount" min="0.01" step="0.01" placeholder="Ex: 50.00" required />
      <button type="submit">Sacar</button>
    </form>

    <div class="history" id="transaction-history">
      <strong>Histórico de transações:</strong>
      <p>Nenhuma transação ainda.</p>
    </div>

    <button id="logout-btn" class="btn-logout">Sair</button>
  </section>
</main>

<footer>
  BOSCO JONES WALLET
</footer>

<script>
  // Usuários simulados em localStorage
  function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }
  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Transações e saldo por usuário
  function getUserData(username) {
    return JSON.parse(localStorage.getItem('wallet-' + username) || '{"balance":0,"transactions":[]}');
  }
  function saveUserData(username, data) {
    localStorage.setItem('wallet-' + username, JSON.stringify(data));
  }

  // Elementos
  const loginSection = document.getElementById('login-section');
  const registerSection = document.getElementById('register-section');
  const walletSection = document.getElementById('wallet-section');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const message = document.getElementById('message');
  const messageRegister = document.getElementById('message-register');

  const userDisplay = document.getElementById('user-display');
  const balance = document.getElementById('balance');
  const balanceFiat = document.getElementById('balance-fiat');

  const depositForm = document.getElementById('deposit-form');
  const withdrawForm = document.getElementB
