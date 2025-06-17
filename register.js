export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, senha } = req.body;
    if (email && senha && senha.length >= 6) {
      res.status(200).json({ success: true, message: 'Registro realizado com sucesso!' });
    } else {
      res.status(400).json({ error: 'Dados inválidos.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido.' });
  }
}
