// blockchain.js
const Web3 = require('web3');
const HoloFi = require('holofi-js');
const { abi, address } = require('./DarkCoinABI.json'); // ABI do contrato e endereço do contrato

require('dotenv').config(); // Carrega as variáveis de ambiente

// Configuração da conexão com a Ethereum via Infura
const infuraUrl = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
const web3 = new Web3(infuraUrl);
const holofi = new HoloFi(web3);

// Endereço da carteira do usuário (configurado via variáveis de ambiente)
const userAddress = process.env.USER_WALLET_ADDRESS || '0xYourWalletAddress';

// Instanciar o contrato DarkCoin
const darkCoinContract = new web3.eth.Contract(abi, address);

// Função para verificar o saldo do usuário
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
    // Verifica se o endereço possui autorização para mintar
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

// Função para verificar se um endereço está autorizado a mintar tokens
async function isAuthorizedToMint(address) {
  try {
    const ownerAddress = await darkCoinContract.methods.owner().call(); // Supondo que o contrato possua a função owner()
    return address === ownerAddress;
  } catch (error) {
    throw new Error('Erro na verificação de autorização: ' + error.message);
  }
}

// Exporta as funções para serem utilizadas na API
module.exports = { checkBalance, transferDarkCoin, mintTokens };
