require('dotenv').config();  // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const axios = require('axios');
const Web3 = require('web3');
const bodyParser = require('body-parser');

// Configuração do servidor Express
const app = express();
app.use(bodyParser.json());

// Configuração da conexão Ethereum (Infura)
const infuraUrl = process.env.INFURA_URL;  // A URL do Infura é carregada da variável de ambiente
const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));

// Defina o endereço da carteira e o contrato (substitua com seus próprios valores)
const userAddress = '0xYourWalletAddress';  // Substitua com o endereço real
const contractAddress = '0xYourContractAddress';  // Substitua com o endereço real do contrato
const abi = [/* ABI do contrato aqui */];  // Substitua com a ABI do seu contrato inteligente

const darkCoinContract = new web3.eth.Contract(abi, contractAddress);

// Endpoint para verificar o saldo do usuário
app.get('/check-balance', async (req, res) => {
    try {
        const balance = await darkCoinContract.methods.balanceOf(userAddress).call();
        const balanceInEther = web3.utils.fromWei(balance, 'ether');  // Converte de Wei para Ether
        res.json({ balance: balanceInEther });
    } catch (error) {
        console.error('Erro ao verificar saldo:', error);
        res.status(500).json({ error: 'Erro ao verificar saldo' });
    }
});

// Endpoint para transferir DarkCoin
app.post('/transfer', async (req, res) => {
    const { toAddress, amount } = req.body;

    if (!toAddress || !amount) {
        return res.status(400).json({ error: 'Faltando endereço ou valor para transferência' });
    }

    try {
        const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
        const tx = await darkCoinContract.methods.transfer(toAddress, amountInWei).send({ from: userAddress });
        res.json(tx);
    } catch (error) {
        console.error('Erro ao transferir tokens:', error);
        res.status(500).json({ error: 'Erro ao transferir tokens' });
    }
});

// Endpoint para gerar QR Code Pix
const pixApiUrl = 'https://api.banco.com.br/pix';  // Substitua com a URL da API Pix real

app.post('/criar-cobranca-pix', async (req, res) => {
    const { chavePix, valor, plano } = req.body;

    if (!chavePix || !valor || !plano) {
        return res.status(400).json({ error: 'Faltam informações para gerar a cobrança' });
    }

    try {
        const response = await axios.post(`${pixApiUrl}/cobrança`, {
            chave: chavePix,
            valor: valor,
            descricao: `Pagamento para o plano ${plano}`,
        });

        const qrCodeData = response.data.qrCode; // QR Code gerado pela API do banco
        res.json({ qrCode: qrCodeData });
    } catch (error) {
        console.error('Erro ao criar cobrança Pix:', error);
        res.status(500).json({ error: 'Erro ao criar cobrança Pix' });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor Express iniciado na porta 3000');
});
