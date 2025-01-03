require('dotenv').config();  // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const MercadoPago = require('mercadopago');
const cors = require('cors');
const app = express();

// Configurações do MercadoPago
MercadoPago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

app.use(express.json());
app.use(cors());  // Permite requisições de outros domínios

// Rota para criação de pagamento
app.post('/create-payment', (req, res) => {
    const { plano, valor } = req.body;

    // Validações simples
    if (!plano || !valor) {
        return res.status(400).json({ error: 'Plano e valor são obrigatórios.' });
    }

    const parsedValor = parseFloat(valor);
    if (isNaN(parsedValor) || parsedValor <= 0) {
        return res.status(400).json({ error: 'O valor precisa ser um número válido maior que 0.' });
    }

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
            success: 'https://www.exemplo.com/success',
            failure: 'https://www.exemplo.com/failure',
            pending: 'https://www.exemplo.com/pending'
        },
        auto_return: 'approved',
    };

    // Cria a preferência no MercadoPago
    MercadoPago.preferences.create(preference)
        .then(function (response) {
            // Retorna o link de pagamento (init_point)
            res.json({
                init_point: response.body.init_point
            });
        })
        .catch(function (error) {
            console.error('Erro ao criar pagamento:', error);
            res.status(500).json({ error: 'Erro ao criar pagamento' });
        });
});

// Inicializa o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
