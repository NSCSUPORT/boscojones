// caps.js
require('dotenv').config();  // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const axios = require('axios');
const Web3 = require('web3');
const HoloFi = require('holofi-js');
const QRCode = require('qrcode');
const { abi, address } = require('./DarkCoinABI.json');  // ABI e endereço do contrato DarkCoin

const app = express();
app.use(express.json());  // Utiliza o parser JSON nativo do Express

// Configurações externas
const pixApiUrl = process.env.PIX_API_URL || 'https://api.banco.com.br/pix';  // URL da API do banco para cobrança Pix
const infuraUrl = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'; // URL do Infura
const userAddress = process.env.USER_WALLET_ADDRESS || '0xYourWalletAddress';  // Endereço da carteira do usuário
const pixApiKey = process.env.PIX_API_KEY || 'your_pix_api_key'; // Chave da API do banco para Pix

// Configura a conexão com a Ethereum via Infura
const web3 = new Web3(infuraUrl);
const holofi = new HoloFi(web3);

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
    // Verifica se o endereço possui permissão para mintar tokens
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
  try {
    // Supondo que o contrato possua a função owner() que retorne o endereço do dono
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
    return res.status(400).json({ error: 'Faltam informações para gerar a cobrança. Verifique chavePix, valor e plano.' });
  }
  try {
    const response = await axios.post(`${pixApiUrl}/cobranca`, {
      chave: chavePix,
      valor: valor,
      descricao: `Pagamento para o plano ${plano}`,
      // Outros parâmetros podem ser adicionados conforme a documentação da API do banco
    }, {
      headers: {
        'Authorization': `Bearer ${pixApiKey}`
      }
    });

    if (!response.data.qrCode) {
      return res.status(500).json({ error: 'Erro ao gerar QR Code da cobrança Pix.' });
    }

    const qrCodeData = response.data.qrCode;
    res.json({ qrCode: qrCodeData });
  } catch (error) {
    console.error('Erro ao criar cobrança Pix:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro ao criar cobrança Pix. Tente novamente mais tarde.' });
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

// Inicializa o servidor na porta 3000
app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});

// Exporta funções para uso em outros módulos, se necessário
module.exports = { checkBalance, transferDarkCoin, mintTokens };
