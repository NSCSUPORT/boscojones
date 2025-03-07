// blockchain.js
const Web3 = require('web3');
const HoloFi = require('holofi-js');
const { abi, address } = require('./DarkCoinABI.json');  // ABI do contrato e endereço do contrato

// Configuração da conexão Ethereum (Infura ou outro provedor)
const infuraUrl = process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'; // Carregar a URL do Infura de variáveis de ambiente ou usar uma padrão
const web3 = new Web3(infuraUrl);
const holofi = new HoloFi(web3);

// Endereço da carteira do usuário (será passado como argumento ou variável de ambiente)
const userAddress = process.env.USER_WALLET_ADDRESS || '0xYourWalletAddress';  // Substitua com o endereço real ou variável de ambiente

// Definir o contrato de Dark Coin
const darkCoinContract = new web3.eth.Contract(abi, address);

// Função para verificar o saldo do usuário
async function checkBalance() {
    try {
        const balance = await darkCoinContract.methods.balanceOf(userAddress).call();
        return web3.utils.fromWei(balance, 'ether');  // Converte o saldo de Wei para Ether
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
        // Verificação adicional para garantir que a mintagem é feita por um endereço autorizado
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

// Função de verificação de autorização (exemplo, pode ser baseada em contrato ou outro critério)
async function isAuthorizedToMint(address) {
    // Aqui você pode adicionar uma lógica real para verificar se o endereço tem permissão de mintagem
    // Exemplo: Verifique um estado no contrato inteligente ou em uma lista de permissões
    return address === '0xAuthorizedAddress';  // Substitua com a lógica real
}

// Exportar funções para uso na API
module.exports = { checkBalance, transferDarkCoin, mintTokens };
