// caps.js
require('dotenv').config(); // Carrega as variáveis de ambiente

const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode'); // Certifique-se de que esse pacote esteja instalado

const app = express();

// Usando o parser JSON nativo do Express
app.use(express.json());

const pixApiUrl = process.env.PIX_API_URL || 'https://api.banco.com.br/pix';  // URL da API do Banco que suporta Pix

// Rota para geração de cobrança Pix
app.post('/criar-cobranca-pix', async (req, res) => {
  const { chavePix, valor, plano } = req.body;

  // Validação de dados de entrada
  if (!chavePix || !valor || !plano) {
    return res.status(400).json({ error: 'Faltam informações para gerar a cobrança. Verifique chavePix, valor e plano.' });
  }

  try {
    // Envia a solicitação de cobrança Pix para a API do banco
    const response = await axios.post(`${pixApiUrl}/cobranca`, {
      chave: chavePix,
      valor: valor,
      descricao: `Pagamento para o plano ${plano}`,
      // Outros parâmetros podem ser adicionados conforme a documentação da API
    }, {
      headers: {
        // Se necessário, adicione cabeçalhos de autenticação, por exemplo:
        // 'Authorization': `Bearer ${process.env.PIX_API_KEY}`
      }
    });

    // Verifica se a resposta contém o QR Code
    if (!response.data.qrCode) {
      return res.status(500).json({ error: 'Erro ao gerar QR Code da cobrança Pix.' });
    }

    // Retorna o QR Code gerado
    res.json({ qrCode: response.data.qrCode });
  } catch (error) {
    console.error('Erro ao criar cobrança Pix:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro ao criar cobrança Pix. Tente novamente mais tarde.' });
  }
});

// Inicia o servidor na porta definida ou na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Pix iniciado na porta ${PORT}`);
});
