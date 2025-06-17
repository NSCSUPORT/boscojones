const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Preencha email e senha.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    // Aqui você pode gerar token JWT, ou salvar sessão
    res.status(200).json({ message: 'Login OK', user: { email: user.email } });
  });
});

module.exports = router;
