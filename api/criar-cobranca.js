const axios = require('axios');
require('dotenv').config();

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { valor } = req.body;
  try {
    const authData = Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64');
    const authResponse = await axios.post(
      `${process.env.PIX_API_URL}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${authData}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    const cobranca = {
      calendario: { expiracao: 3600 },
      devedor: { nome: "Lucas Januário", cpf: "12345678909" },
      valor: { original: valor },
      chave: process.env.PIX_CHAVE,
      solicitacaoPagador: "Pagamento via JBX Wallet"
    };

    const { data } = await axios.post(`${process.env.PIX_API_URL}/v2/cob`, cobranca, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });

    const qr = await axios.get(`${process.env.PIX_API_URL}/v2/loc/${data.loc.id}/qrcode`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.status(200).json({
      txid: data.txid,
      qrcode: qr.data.qrcode,
      imagemQrcode: qr.data.imagemQrcode
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao gerar cobrança Pix." });
  }
};