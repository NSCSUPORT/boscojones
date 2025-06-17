require('dotenv').config();
const express = require('express');
const axios = require('axios');
const db = require('./database');
const app = express();

app.use(express.json());

// Função para autenticar na API Pix Gerencianet
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

app.post('/criar-cobranca', async (req, res) => {
  try {
    const saldoAtual = await new Promise((resolve, reject) => {
      db.pegarSaldo((err, saldo) => {
        if (err) reject(err);
        else resolve(saldo);
      });
    });

    if (saldoAtual <= 0) {
      return res.status(400).json({ error: "Saldo insuficiente para gerar cobrança Pix" });
    }

    const accessToken = await auth();

    const body = {
      calendario: { expiracao: 3600 },
      devedor: {
        nome: "Lucas Januário",
        cpf: "12345678909"
      },
      valor: {
        original: saldoAtual.toFixed(2)
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
        if (err) reject(err);
        else {
          db.adicionarTransacao('pix', saldoAtual, (err2) => {
            if (err2) reject(err2);
            else resolve();
          });
        }
      });
    });

    res.json({
      txid: data.txid,
      location: data.loc.id,
      qrcode: qrResponse.data.qrcode,
      imagemQrcode: qrResponse.data.imagemQrcode
    });
  } catch (error) {
    console.error("Erro ao gerar cobrança Pix:", error?.response?.data || error.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix" });
  }
});

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

app.get('/saldo', (req, res) => {
  db.pegarSaldo((err, saldo) => {
    if (err) return res.status(500).json({ error: "Erro ao consultar saldo" });
    res.json({ saldo });
  });
});

app.listen(3000, () => {
  console.log("API Pix rodando em http://localhost:3000");
});
