const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./database');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Preencha email e senha.' });
  }

  try {
    const hash = await bcrypt.hash(senha, 10);
    db.run(
      `INSERT INTO users (email, senha) VALUES (?, ?)`,
      [email, hash],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Email já registrado.' });
          }
          return res.status(500).json({ error: 'Erro ao registrar.' });
        }
        res.status(200).json({ message: 'Registro OK' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

module.exports = router;
