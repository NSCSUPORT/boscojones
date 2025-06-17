import { Client } from 'pg';
import bcrypt from 'bcrypt';

const saltRounds = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { email, senha } = req.body;

  if (!email || !senha || senha.length < 6) {
    return res.status(400).json({ error: 'Email e senha (mín 6 caracteres) são obrigatórios' });
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const exists = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      await client.end();
      return res.status(409).json({ error: 'Usuário já registrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    await client.query('INSERT INTO usuarios(email, senha) VALUES ($1, $2)', [email, hashedPassword]);

    await client.end();
    return res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    await client.end();
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
