// caps.js
require('dotenv').config();  // Carrega variáveis de ambiente
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const Web3 = require('web3');
const HoloFi = require('holofi-js');
const QRCode = require('qrcode');
const { abi, address } = require('./DarkCoinABI.json');  // ABI do contrato e endereço do contrato

const app = express();
app.use(bodyParser.json());

// URL da API do Banco para cobrança Pix
const pixApiUrl = process.env.PIX_API_URL || 'https://api.banco.com.br/pix';
// URL do Infura para conexão com Ethereum
const infuraUrl = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
const web3 = new Web3(infuraUrl);
const holofi = new HoloFi(web3);

// Endereço da carteira do usuário (definido via variável de ambiente)
const userAddress = process.env.USER_WALLET_ADDRESS || '0xYourWalletAddress';

// Instanciar o contrato DarkCoin
const darkCoinContract = new web3.eth.Contract(abi, address);

// Função para verificar o saldo do usuário no contrato DarkCoin
async function checkBalance() {
    try {
        const balance = await darkCoinContract.methods.balanceOf(userAddress).call();
        return web3.utils.fromWei(balance, 'ether'); // Converte de Wei para Ether
    } catch (error) {
        throw new Error('Erro ao verificar saldo: ' + error.message);
    }
}

// Função para transferir DarkCoin para outro endereço
async function transferDarkCoin(toAddress, amount) {
    if (!web3.utils.isAddress(toAddress)) {
        throw new Error('Endereço inválido');
    }
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Quantidade inválida');
    }
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    try {
        const tx = await darkCoinContract.methods.transfer(toAddress, amountInWei).send({ from: userAddress });
        return tx;
    } catch (error) {
        throw new Error('Erro ao transferir tokens: ' + error.message);
    }
}

// Função para mintar novos tokens
async function mintTokens(amount) {
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Quantidade inválida');
    }
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    try {
        // Verificação para garantir que somente o endereço autorizado pode mintar
        const isAuthorized = await isAuthorizedToMint(userAddress);
        if (!isAuthorized) {
            throw new Error('Você não tem permissão para mintar tokens.');
        }
        const tx = await darkCoinContract.methods.mint(userAddress, amountInWei).send({ from: userAddress });
        return tx;
    } catch (error) {
        throw new Error('Erro ao mintear tokens: ' + error.message);
    }
}

// Função de verificação de autorização para mintagem
async function isAuthorizedToMint(address) {
    // Supondo que o contrato possua uma função owner() que retorne o endereço do dono
    try {
        const ownerAddress = await darkCoinContract.methods.owner().call();
        return address === ownerAddress;
    } catch (error) {
        throw new Error('Erro na verificação de autorização: ' + error.message);
    }
}

// Rota para gerar cobrança Pix
app.post('/criar-cobranca-pix', async (req, res) => {
    const { chavePix, valor, plano } = req.body;
    if (!chavePix || !valor || !plano) {
        return res.status(400).json({ error: 'Faltam informações para gerar a cobrança' });
    }
    try {
        // Envia a solicitação de cobrança Pix para a API do banco
        const response = await axios.post(`${pixApiUrl}/cobranca`, {
            chave: chavePix,
            valor: valor,
            descricao: `Pagamento para o plano ${plano}`,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.PIX_API_KEY}`
            }
        });
        const qrCodeData = response.data.qrCode;  // Supõe que a resposta contenha o QR Code
        res.json({ qrCode: qrCodeData });
    } catch (error) {
        console.error('Erro ao criar cobrança Pix:', error);
        res.status(500).json({ error: 'Erro ao criar cobrança Pix' });
    }
});

// Rota para verificar o saldo da DarkCoin
app.get('/check-balance', async (req, res) => {
    try {
        const balance = await checkBalance();
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar saldo' });
    }
});

// Rota para transferir DarkCoin
app.post('/transfer-darkcoin', async (req, res) => {
    const { toAddress, amount } = req.body;
    if (!web3.utils.isAddress(toAddress) || !amount) {
        return res.status(400).json({ error: 'Endereço ou valor inválido' });
    }
    try {
        const tx = await transferDarkCoin(toAddress, amount);
        res.json({ tx });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao transferir tokens' });
    }
});

// Rota para mintar novos tokens
app.post('/mint-tokens', async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ error: 'Valor para mintagem não especificado' });
    }
    try {
        const tx = await mintTokens(amount);
        res.json({ tx });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao mintear tokens' });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor iniciado na porta 3000');
});

module.exports = { checkBalance, transferDarkCoin, mintTokens };
