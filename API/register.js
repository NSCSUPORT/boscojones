export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, senha } = req.body;
    // Aqui você pode salvar no SQLite, Firebase ou localStorage simulado
    res.status(200).json({ success: true, message: 'Registrado com sucesso!' });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
