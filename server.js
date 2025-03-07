require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const MercadoPago = require('mercadopago');
const cors = require('cors');

const app = express();

// Configurações do MercadoPago usando a variável de ambiente
MercadoPago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

// Middlewares
app.use(express.json());
app.use(cors()); // Permite requisições de outros domínios

/**
 * Rota para criação de pagamento via MercadoPago
 * Recebe no body: { plano, valor }
 */
app.post('/create-payment', async (req, res) => {
  const { plano, valor } = req.body;

  // Validação simples dos dados de entrada
  if (!plano || !valor) {
    return res.status(400).json({ error: 'Plano e valor são obrigatórios.' });
  }

  const parsedValor = parseFloat(valor);
  if (isNaN(parsedValor) || parsedValor <= 0) {
    return res.status(400).json({ error: 'O valor precisa ser um número válido maior que 0.' });
  }

  // Criação da preferência de pagamento
  const preference = {
    items: [
      {
        title: plano,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parsedValor,
      }
    ],
    back_urls: {
      success: process.env.BACK_URL_SUCCESS || 'https://www.exemplo.com/success',
      failure: process.env.BACK_URL_FAILURE || 'https://www.exemplo.com/failure',
      pending: process.env.BACK_URL_PENDING || 'https://www.exemplo.com/pending'
    },
    auto_return: 'approved',
  };

  try {
    // Cria a preferência no MercadoPago
    const response = await MercadoPago.preferences.create(preference);
    // Retorna o link de pagamento (init_point)
    return res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Erro ao criar pagamento. Tente novamente mais tarde.' });
  }
});

// Inicializa o servidor na porta definida ou 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
