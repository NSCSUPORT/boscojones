const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
app.use(bodyParser.json());

const pixApiUrl = 'https://api.banco.com.br/pix';  // URL da API do Banco que suporta Pix (exemplo)

// Geração de cobrança Pix
app.post('/criar-cobranca-pix', async (req, res) => {
    const { chavePix, valor, plano } = req.body;

    if (!chavePix || !valor || !plano) {
        return res.status(400).json({ error: 'Faltam informações para gerar a cobrança' });
    }

    try {
        // Envia a solicitação de cobrança Pix para a API bancária
        const response = await axios.post(`${pixApiUrl}/cobrança`, {
            chave: chavePix,
            valor: valor,
            descricao: `Pagamento para o plano ${plano}`,
            // Outros parâmetros conforme a API do banco
        });

        const qrCodeData = response.data.qrCode; // Aqui você pegaria o QR code gerado pela API do banco
        res.json({ qrCode: qrCodeData });
    } catch (error) {
        console.error('Erro ao criar cobrança Pix:', error);
        res.status(500).json({ error: 'Erro ao criar cobrança Pix' });
    }
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor de Pix iniciado na porta 3000');
});
