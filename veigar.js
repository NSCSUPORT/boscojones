// Importar Web3.js
const Web3 = require('web3');
require('dotenv').config();  // Carregar variáveis de ambiente

// Configurar Web3 para se conectar ao Infura
const web3 = new Web3(process.env.INFURA_URL);  // Carrega a URL do Infura da variável de ambiente

// Endereço do usuário (substitua com o endereço desejado)
const userAddress = '0xSeuEnderecoEthereumAqui'; // Substitua pelo endereço que você deseja consultar

// ABI do contrato ERC20 (exemplo, substitua pelo ABI real do contrato)
const contractABI = [ /* ABI do contrato aqui */ ];
const contractAddress = '0xContratoEthereumAqui'; // Endereço do contrato

// Criar uma instância do contrato
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Função para verificar o saldo de ETH de um endereço
async function checkBalance(address) {
    try {
        // Obter saldo (em Wei) e convertê-lo para Ether
        const balanceWei = await web3.eth.getBalance(address);
        const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
        console.log(`Saldo de ${address}: ${balanceEther} ETH`);
    } catch (error) {
        console.error("Erro ao obter saldo:", error);
    }
}

// Função para verificar o saldo de tokens ERC20
async function checkTokenBalance(address) {
    try {
        const balance = await contract.methods.balanceOf(address).call();
        const balanceInTokens = web3.utils.fromWei(balance, 'ether');
        console.log(`Saldo do token no endereço ${address}: ${balanceInTokens}`);
    } catch (error) {
        console.error("Erro ao obter saldo do token:", error);
    }
}

// Função para enviar Ether de um endereço para outro
async function sendTransaction(fromAddress, toAddress, amount) {
    try {
        const signedTx = await web3.eth.accounts.signTransaction({
            to: toAddress,
            value: web3.utils.toWei(amount.toString(), 'ether'),
            gas: 21000, // Quantidade de gás padrão para transferência de Ether
        }, 'SuaChavePrivadaAqui'); // Substitua com sua chave privada ou utilize Metamask

        // Enviar a transação assinada
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Transação enviada:', receipt);
    } catch (error) {
        console.error("Erro ao enviar transação:", error);
    }
}

// Exemplo de uso: Verificar o saldo de ETH
checkBalance(userAddress);

// Exemplo de uso: Verificar o saldo de tokens
checkTokenBalance(userAddress);

// Exemplo de uso: Enviar Ether (substitua os endereços e a quantidade de Ether)
const toAddress = '0xEnderecoDestinoAqui';
const amount = 0.1; // Quantidade de Ether para enviar
sendTransaction(userAddress, toAddress, amount);
