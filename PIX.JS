require('dotenv').config();
const express = require('express');
const axios = require('axios');
const db = require('./database'); // Banco SQLite
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Autenticação com a API Pix (Gerencianet)
const auth = async () => {
  try {
    const authData = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      `${process.env.PIX_API_URL}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${authData}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Erro ao autenticar:", error.response?.data || error.message);
    throw new Error("Falha na autenticação Pix");
  }
};

// Criar cobrança Pix e zerar saldo
app.post('/criar-cobranca', async (req, res) => {
  try {
    const saldoAtual = await new Promise((resolve, reject) => {
      db.pegarSaldo((err, saldo) => (err ? reject(err) : resolve(saldo)));
    });

    if (saldoAtual <= 0) {
      return res.status(400).json({ error: "Saldo insuficiente para gerar cobrança Pix" });
    }

    const accessToken = await auth();

    const valorOriginal = saldoAtual.toFixed(2);

    const body = {
      calendario: { expiracao: 3600 },
      devedor: {
        nome: "Lucas Januário",
        cpf: "48761013889" // ⚠️ 
      valor: {
        original: valorOriginal
      },
      chave: process.env.PIX_CHAVE,
      solicitacaoPagador: "Pagamento via JBX Wallet"
    };

    const { data } = await axios.post(
      `${process.env.PIX_API_URL}/v2/cob`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const qrResponse = await axios.get(
      `${process.env.PIX_API_URL}/v2/loc/${data.loc.id}/qrcode`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    await new Promise((resolve, reject) => {
      db.atualizarSaldo(0, (err) => {
        if (err) return reject(err);
        db.adicionarTransacao('pix', saldoAtual, (err2) => (err2 ? reject(err2) : resolve()));
      });
    });

    res.json({
      txid: data.txid,
      location: data.loc.id,
      qrcode: qrResponse.data.qrcode,
      imagemQrcode: qrResponse.data.imagemQrcode
    });

  } catch (error) {
    console.error("Erro ao gerar cobrança Pix:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix" });
  }
});

// Depositar saldo
app.post('/depositar', (req, res) => {
  const valor = parseFloat(req.body.valor);
  if (isNaN(valor) || valor <= 0) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  db.depositar(valor, (err) => {
    if (err) return res.status(500).json({ error: "Erro ao depositar" });
    res.json({ message: `Depósito de R$ ${valor.toFixed(2)} realizado com sucesso!` });
  });
});

// Sacar saldo
app.post('/sacar', (req, res) => {
  const valor = parseFloat(req.body.valor);
  if (isNaN(valor) || valor <= 0) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  db.sacar(valor, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Erro ao sacar" });
    res.json({ message: `Saque de R$ ${valor.toFixed(2)} realizado com sucesso!` });
  });
});

// Consultar saldo
app.get('/saldo', (req, res) => {
  db.pegarSaldo((err, saldo) => {
    if (err) return res.status(500).json({ error: "Erro ao consultar saldo" });
    res.json({ saldo });
  });
});

// Inicia servidor na porta correta (Vercel/Heroku/Local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Pix rodando em http://localhost:${PORT}`);
});
