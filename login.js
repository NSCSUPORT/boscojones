export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, senha } = req.body;
    if (email && senha) {
      res.status(200).json({ success: true, message: 'Login realizado com sucesso!' });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido.' });
  }
}
