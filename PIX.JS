require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Função de autenticação OAuth2
const auth = async () => {
  try {
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
  } catch (error) {
    console.error("❌ Erro na autenticação:", error?.response?.data || error.message);
    throw new Error("Falha ao autenticar com a API Pix");
  }
};

// Rota para criar cobrança Pix
app.post('/criar-cobranca', async (req, res) => {
  try {
    const valor = req.body.valor || "10.00";
    const accessToken = await auth();

    const body = {
      calendario: { expiracao: 3600 },
      devedor: {
        nome: "Lucas Januário",
        cpf: "12345678909" // Usar CPF válido em produção
      },
      valor: {
        original: parseFloat(valor).toFixed(2)
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

    res.json({
      txid: data.txid,
      location: data.loc.id,
      qrcode: qrResponse.data.qrcode,
      imagemQrcode: qrResponse.data.imagemQrcode
    });

  } catch (error) {
    console.error("❌ Erro ao gerar cobrança:", error?.response?.data || error.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix" });
  }
});

// Inicializa servidor
app.listen(3000, () => {
  console.log('✅ API Pix rodando em http://localhost:3000');
});
