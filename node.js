const express = require('express');
const MercadoPago = require('mercadopago');
const app = express();

MercadoPago.configurations.setAccessToken('APP_USR-5426605333181809-010315-b06229d80c1e63ed582dbd28e27c677a-1658720398'); // Substitua com seu token

app.use(express.json());

app.post('/create-payment', (req, res) => {
    const { plano, valor } = req.body;

    const preference = {
        items: [
            {
                title: plano,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: parseFloat(valor),
            }
        ],
        back_urls: {
            success: 'https://www.exemplo.com/success',
            failure: 'https://www.exemplo.com/failure',
            pending: 'https://www.exemplo.com/pending'
        },
        auto_return: 'approved',
    };

    MercadoPago.preferences.create(preference)
        .then(function (response) {
            res.json({
                init_point: response.body.init_point
            });
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send('Erro ao criar pagamento');
        });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
