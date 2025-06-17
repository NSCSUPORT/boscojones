// pix-backend.js
require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());

// Carrega certificados do Pix
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.PIX_CERT),
  key: fs.readFileSync(process.env.PIX_KEY),
  rejectUnauthorized: false
});

// Função para obter token OAuth2
async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PIX_CLIENT_ID}:${process.env.PIX_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    'https://api-pix.gerencianet.com.br/oauth/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent
    }
  );
  return response.data.access_token;
}

// Rota para criar cobrança Pix
app.post('/criar-pix', async (req, res) => {
  const { valor, chave, txid } = req.body;
  try {
    const token = await getAccessToken();
    const body = {
      calendario: { expiracao: 3600 },
      valor: { original: valor },
      chave,
      solicitacaoPagador: 'Pagamento via JBX1000'
    };

    const response = await axios.put(
      `https://api-pix.gerencianet.com.br/v2/cob/${txid}`,
      body,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ erro: 'Falha na criação do Pix', detalhe: err.message });
  }
});

app.listen(3000, () => console.log('Servidor Pix iniciado na porta 3000'));
