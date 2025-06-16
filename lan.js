// Funções para manipular usuários e dados no localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function getUserData(username) {
  return JSON.parse(localStorage.getItem('wallet-' + username) || '{"balance":0,"transactions":[]}');
}
function saveUserData(username, data) {
  localStorage.setItem('wallet-' + username, JSON.stringify(data));
}

// Elementos da página
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
const withdrawForm = document.getElementById('withdraw-form');
const transactionHistory = document.getElementById('transaction-history');

const logoutBtn = document.getElementById('logout-btn');

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

let currentUser = null;
let currentBalance = 0.0;
let transactionLog = [];

// Navegação entre telas
showRegisterLink.onclick = e => {
  e.preventDefault();
  message.textContent = '';
  messageRegister.textContent = '';
  loginSection.style.display = 'none';
  registerSection.style.display = 'block';
};
showLoginLink.onclick = e => {
  e.preventDefault();
  message.textContent = '';
  messageRegister.textContent = '';
  registerSection.style.display = 'none';
  loginSection.style.display = 'block';
};

// Atualiza saldo na tela
function updateBalance() {
  balance.textContent = `B$ ${currentBalance.toFixed(2)}`;
  const usd = currentBalance * 0.5;
  balanceFiat.textContent = `USD ${usd.toFixed(2)}`;
}

// Atualiza histórico na tela
function updateHistory() {
  if(transactionLog.length === 0){
    transactionHistory.innerHTML = '<strong>Histórico de transações:</strong><p>Nenhuma transação ainda.</p>';
    return;
  }
  let html = '<strong>Histórico de transações:</strong>';
  for(let i = transactionLog.length - 1; i >= 0; i--){
    const t = transactionLog[i];
    html += `<p>[${t.date}] - <strong>${t.type}</strong>: B$ ${t.amount.toFixed(2)}</p>`;
  }
  transactionHistory.innerHTML = html;
}

// Login
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  message.textContent = '';
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    message.style.color = 'red';
    message.textContent = 'Usuário ou senha inválidos.';
    return;
  }
  currentUser = user.username;
  const userData = getUserData(currentUser);
  currentBalance = userData.balance;
  transactionLog = userData.transactions;
  userDisplay.textContent = currentUser;
  updateBalance();
  updateHistory();
  loginSection.style.display = 'none';
  walletSection.style.display = 'block';
  loginForm.reset();
});

// Registro
registerForm.addEventListener('submit', e => {
  e.preventDefault();
  messageRegister.textContent = '';
  const username = registerForm['reg-username'].value.trim();
  const password = registerForm['reg-password'].value.trim();
  if (username.length < 3) {
    messageRegister.style.color = 'red';
    messageRegister.textContent = 'Usuário deve ter pelo menos 3 caracteres.';
    return;
  }
  if (password.length < 4) {
    messageRegister.style.color = 'red';
    messageRegister.textContent = 'Senha deve ter pelo menos 4 caracteres.';
    return;
  }
  let users = getUsers();
  if(users.find(u => u.username === username)){
    messageRegister.style.color = 'red';
    messageRegister.textContent = 'Usuário já existe.';
    return;
  }
  users.push({username, password});
  saveUsers(users);
  messageRegister.style.color = 'green';
  messageRegister.textContent = 'Conta criada com sucesso! Faça login.';
  registerForm.reset();
});

// Depositar
depositForm.addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  if(isNaN(amount) || amount <= 0){
    alert('Insira um valor válido para depósito.');
    return;
  }
  currentBalance += amount;
  transactionLog.push({
    type: 'Depósito',
    amount: amount,
    date: new Date().toLocaleString()
  });
  updateBalance();
  updateHistory();
  saveUserData(currentUser, {balance: currentBalance, transactions: transactionLog});
  depositForm.reset();
});

// Sacar
withdrawForm.addEventListener('submit', e => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  if(isNaN(amount) || amount <= 0){
    alert('Insira um valor válido para saque.');
    return;
  }
  if(amount > currentBalance){
    alert('Saldo insuficiente para saque.');
    return;
  }
  currentBalance -= amount;
  transactionLog.push({
    type: 'Saque',
    amount: amount,
    date: new Date().toLocaleString()
  });
  updateBalance();
  updateHistory();
  saveUserData(currentUser, {balance: currentBalance, transactions: transactionLog});
  withdrawForm.reset();
});

// Logout
logoutBtn.addEventListener('click', () => {
  loginSection.style.display = 'block';
  walletSection.style.display = 'none';
  currentUser = null;
  currentBalance = 0.0;
  transactionLog = [];
  loginForm.reset();
  message.textContent = '';
});
