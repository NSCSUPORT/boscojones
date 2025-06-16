// lan.js

// Retorna a lista de usuários cadastrados (array de objetos {username, password})
export function getUsers() {
  const usersJSON = localStorage.getItem('users');
  if (!usersJSON) return [];
  try {
    return JSON.parse(usersJSON);
  } catch {
    return [];
  }
}

// Salva a lista de usuários no localStorage
export function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Retorna os dados da carteira de um usuário específico
// { balance: number, transactions: Array<{type:string, amount:number, date:string}> }
export function getUserData(username) {
  const dataJSON = localStorage.getItem('wallet-' + username);
  if (!dataJSON) return { balance: 0, transactions: [] };
  try {
    return JSON.parse(dataJSON);
  } catch {
    return { balance: 0, transactions: [] };
  }
}

// Salva os dados da carteira de um usuário específico
export function saveUserData(username, data) {
  localStorage.setItem('wallet-' + username, JSON.stringify(data));
}
