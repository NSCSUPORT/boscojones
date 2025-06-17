// api/login.js
let users = []; // Deve ser o mesmo array de register (ideal: usar banco real)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  // Verificar usuário e senha
  const user = users.find(u => u.email === email && u.senha === senha);

  if (!user) {
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  }

  return res.status(200).json({ message: 'Login realizado com sucesso' });
}
