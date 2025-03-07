// app.js
const express = require('express');
const axios = require('axios');
const { checkBalance, transferDarkCoin, mintTokens } = require('./blockchain'); // Importar funções da blockchain
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware para lidar com JSON
app.use(express.json());

// URL da API da Dark Coin da main net
const darkCoinAPIUrl = process.env.DARKCOIN_API_URL;
const apiKey = process.env.DARKCOIN_API_KEY;

// Rota para obter o saldo
app.get('/balance', async (req, res) => {
    try {
        const balance = await checkBalance();  // Chama a função para verificar o saldo na blockchain
        res.json({ balance });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao consultar o saldo');
    }
});

// Rota para realizar uma transação
app.post('/transaction', async (req, res) => {
    const { amount, recipient } = req.body;

    if (!amount || !recipient) {
        return res.status(400).send('Valor e destinatário são obrigatórios');
    }

    try {
        const transaction = await transferDarkCoin(recipient, amount); // Chama a função para transferir
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao realizar transação');
    }
});

// Rota para mintar tokens
app.post('/mint', async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).send('Valor de tokens a serem minteados é obrigatório');
    }

    try {
        const mintResult = await mintTokens(amount); // Chama a função para mintar tokens
        res.json(mintResult);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao mintear tokens');
    }
});

// Iniciar o servidor Express
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
