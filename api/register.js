// api/register.js
let users = []; // Em memória (reinicia a cada deploy / cold start)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  if (!email || !senha || senha.length < 6) {
    return res.status(400).json({ error: 'Email e senha (mín 6 caracteres) são obrigatórios' });
  }

  // Verificar se usuário já existe
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Usuário já registrado' });
  }

  // Salvar usuário (em memória)
  users.push({ email, senha });

  return res.status(201).json({ message: 'Usuário registrado com sucesso' });
}
