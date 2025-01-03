const express = require('express');
const mercadopago = require('mercadopago');

// Configuração do Mercado Pago com seu Access Token
mercadopago.configurations.setAccessToken('APP_USR-5426605333181809-010315-b06229d80c1e63ed582dbd28e27c677a-1658720398');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Rota para criar o pagamento
app.post('/criar-pagamento', async (req, res) => {
    try {
        // Criação da preferência de pagamento
        const preference = {
            items: [
                {
                    title: req.body.plano,
                    unit_price: parseFloat(req.body.valor),
                    quantity: 1,
                },
            ],
            back_urls: {
                success: 'https://seusite.com/sucesso',
                failure: 'https://seusite.com/falha',
                pending: 'https://seusite.com/pendente',
            },
            auto_return: 'approved',
        };

        const response = await mercadopago.preferences.create(preference);
        res.json({ init_point: response.body.init_point });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
