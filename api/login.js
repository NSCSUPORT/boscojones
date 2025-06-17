// api/login.js
import { Client } from 'pg';

const connectionString = 'postgresql://postgres:[LUCASJ4NJ4N1891@@_@12]@db.twiuahfzftwlnfbeanav.supabase.co:5432/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Verifica usuário e senha
    const result = await client.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2', [email, senha]);

    await client.end();

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    return res.status(200).json({ message: 'Login realizado com sucesso' });
  } catch (err) {
    await client.end();
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
