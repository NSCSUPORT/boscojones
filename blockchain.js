// blockchain.js
const Web3 = require('web3');
const HoloFi = require('holofi-js');
const { abi, address } = require('./DarkCoinABI.json');  // ABI do contrato e endereço do contrato

// Configuração da conexão Ethereum (Infura ou outro provedor)
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'); // Altere para sua chave do Infura
const holofi = new HoloFi(web3);

// Endereço da carteira do usuário
const userAddress = '0xYourWalletAddress';  // Substitua pelo endereço real

// Definir o contrato de Dark Coin
const darkCoinContract = new web3.eth.Contract(abi, address);

// Função para verificar o saldo do usuário
async function checkBalance() {
    try {
        const balance = await darkCoinContract.methods.balanceOf(userAddress).call();
        return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        throw new Error('Erro ao verificar saldo: ' + error.message);
    }
}

// Função para transferir Dark Coin
async function transferDarkCoin(toAddress, amount) {
    if (!web3.utils.isAddress(toAddress)) {
        throw new Error('Endereço inválido');
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
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    try {
        const tx = await darkCoinContract.methods.mint(userAddress, amountInWei).send({ from: userAddress });
        return tx;
    } catch (error) {
        throw new Error('Erro ao mintear tokens: ' + error.message);
    }
}

// Exportar funções para uso na API
module.exports = { checkBalance, transferDarkCoin, mintTokens };
