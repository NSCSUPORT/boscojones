require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const auth = async () => {
  const authData = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${process.env.PIX_SANDBOX_URL}/oauth/token`,
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
    const accessToken = await auth();

    const body = {
      calendario: { expiracao: 3600 },
      devedor: {
        nome: "Lucas Januário",
        cpf: "12345678909"
      },
      valor: {
        original: "10.00"
      },
      chave: "SEUEMAIL@seudominio.com.br", // Chave Pix
      solicitacaoPagador: "Pagamento do serviço Bosco Jones"
    };

    const { data } = await axios.post(
      `${process.env.PIX_SANDBOX_URL}/v2/cob`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const txid = data.txid;

    const qrResponse = await axios.get(
      `${process.env.PIX_SANDBOX_URL}/v2/loc/${data.loc.id}/qrcode`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json({
      txid,
      location: data.loc.id,
      qrcode: qrResponse.data.qrcode,
      imagemQrcode: qrResponse.data.imagemQrcode
    });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix" });
  }
});

app.listen(3000, () => {
  console.log('API Pix rodando em http://localhost:3000');
});
