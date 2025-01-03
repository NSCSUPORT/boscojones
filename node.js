// Exemplo com Node.js usando express e Mercado Pago SDK
const express = require('express');
const MercadoPago = require('mercadopago');
const app = express();

// Configuração do Mercado Pago (substitua com seu ACCESS TOKEN)
MercadoPago.configurations.setAccessToken('YOUR_ACCESS_TOKEN');

app.use(express.json());

app.post('/create-payment', (req, res) => {
    const { plano, valor } = req.body;

    const preference = {
        items: [
            {
                title: plano,
                quantity: 1,
                unit_price: parseFloat(valor),
                currency_id: 'BRL',
            },
        ],
        payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }], // Exclui outras formas de pagamento (se desejar)
            installments: 1,
        },
        back_urls: {
            success: 'https://www.exemplo.com/success',
            failure: 'https://www.exemplo.com/failure',
            pending: 'https://www.exemplo.com/pending',
        },
        auto_return: 'approved',
        notification_url: 'https://www.exemplo.com/notification',
    };

    // Criação de preferência
    MercadoPago.preferences.create(preference)
        .then(function (response) {
            res.json({ init_point: response.body.init_point });
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send('Erro ao criar pagamento');
        });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
