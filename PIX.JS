require('dotenv').config();
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('database.db');

// Cria a tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY,
    saldo REAL DEFAULT 0
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    valor REAL,
    chave TEXT,
    data TEXT
  )
`);

// Inicializa saldo se não houver
db.get("SELECT * FROM wallet WHERE id = 1", (err, row) => {
  if (!row) db.run("INSERT INTO wallet (id, saldo) VALUES (1, 0)");
});

const auth = async () => {
  const authData = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    `${process.env.PIX_API_URL}/oauth/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${authData}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return response.data.access_token;
};

// Obter saldo atual
app.get('/saldo', (req, res) => {
  db.get("SELECT saldo FROM wallet WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ saldo: row?.saldo || 0 });
  });
});

// Depósito fictício (para teste)
app.post('/depositar', (req, res) => {
  const { valor } = req.body;
  db.run("UPDATE wallet SET saldo = saldo + ? WHERE id = 1", [valor], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run("INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, datetime('now'))", ['deposito', valor]);
    res.json({ status: 'Depósito adicionado' });
  });
});

// Criar cobrança Pix
app.post('/criar-cobranca', async (req, res) => {
  try {
    const { valor } = req.body;
    const accessToken = await auth();

    const body = {
      calendario: { expiracao: 3600 },
      devedor: {
        nome: "Lucas Januário",
        cpf: "12345678909"
      },
      valor: { original: valor },
      chave: process.env.PIX_CHAVE,
      solicitacaoPagador: "Pagamento via JBX Wallet"
    };

    const { data } = await axios.post(`${process.env.PIX_API_URL}/v2/cob`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const qrResponse = await axios.get(`${process.env.PIX_API_URL}/v2/loc/${data.loc.id}/qrcode`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    db.run("UPDATE wallet SET saldo = 0 WHERE id = 1");
    db.run("INSERT INTO transacoes (tipo, valor, data) VALUES (?, ?, datetime('now'))", ['pix_gerado', valor]);

    res.json({
      txid: data.txid,
      qrcode: qrResponse.data.qrcode,
      imagemQrcode: qrResponse.data.imagemQrcode
    });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix" });
  }
});

// Enviar Pix real
app.post('/sacar', async (req, res) => {
  try {
    const { valor, chave } = req.body;
    const accessToken = await auth();

    db.get("SELECT saldo FROM wallet WHERE id = 1", (err, row) => {
      if (err || !row || row.saldo < valor) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }

      const body = {
        valor: valor.toFixed(2),
        chave: chave,
        descricao: "Saque via JBX Wallet"
      };

      axios.post(`${process.env.PIX_API_URL}/v2/pix`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }).then(() => {
        db.run("UPDATE wallet SET saldo = saldo - ? WHERE id = 1", [valor]);
        db.run("INSERT INTO transacoes (tipo, valor, chave, data) VALUES (?, ?, ?, datetime('now'))", ['saque', valor, chave]);
        res.json({ status: "Pix enviado com sucesso" });
      }).catch(err => {
        console.error("Erro ao enviar Pix:", err?.response?.data || err.message);
        res.status(500).json({ error: "Erro ao enviar Pix" });
      });
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao autenticar ou enviar Pix" });
  }
});

app.listen(3000, () => {
  console.log('🚀 API Pix com SQLite rodando em http://localhost:3000');
});
