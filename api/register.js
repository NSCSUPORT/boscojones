// api/register.js
import { Client } from 'pg';

const connectionString = 'postgresql://postgres:[LUCASJ4NJ4N1891@@_@12]@db.twiuahfzftwlnfbeanav.supabase.co:5432/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, senha } = req.body;

  if (!email || !senha || senha.length < 6) {
    return res.status(400).json({ error: 'Email e senha (mín 6 caracteres) são obrigatórios' });
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Verifica se usuário já existe
    const exists = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      await client.end();
      return res.status(409).json({ error: 'Usuário já registrado' });
    }

    // Insere novo usuário
    await client.query('INSERT INTO usuarios(email, senha) VALUES ($1, $2)', [email, senha]);

    await client.end();
    return res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    await client.end();
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
