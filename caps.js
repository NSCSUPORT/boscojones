// caps.js
REQUIRE('DOTENV').CONFIG();  // CARREGA VARIÁVEIS DE AMBIENTE
CONST EXPRESS = REQUIRE('EXPRESS');
CONST BODYPARSER = REQUIRE('BODY-PARSER');
CONST AXIOS = REQUIRE('AXIOS');
CONST WEB3 = REQUIRE('WEB3');
CONST HOLOFI = REQUIRE('HOLOFI-JS');
CONST QRCODE = REQUIRE('QRCODE');
CONST { ABI, ADDRESS } = REQUIRE('./DARKCOINABI.JSON');  // ABI DO CONTRATO E ENDEREÇO DO CONTRATO

CONST APP = EXPRESS();
APP.USE(BODYPARSER.JSON());

// URL DA API DO BANCO PARA COBRANÇA PIX
CONST PIXAPIURL = PROCESS.ENV.PIX_API_URL || 'HTTPS://API.BANCO.COM.BR/PIX';
// URL DO INFURA PARA CONEXÃO COM ETHEREUM
CONST INFURAURL = PROCESS.ENV.INFURA_URL || 'HTTPS://MAINNET.INFURA.IO/V3/YOUR_INFURA_PROJECT_ID';
CONST WEB3 = NEW WEB3(INFURAURL);
CONST HOLOFI = NEW HOLOFI(WEB3);

// ENDEREÇO DA CARTEIRA DO USUÁRIO (DEFINIDO VIA VARIÁVEL DE AMBIENTE)
CONST USERADDRESS = PROCESS.ENV.USER_WALLET_ADDRESS || '0XYOURWALLETADDRESS';

// INSTANTIAR O CONTRATO DARKCOIN
CONST DARKCOINCONTRACT = NEW WEB3.ETH.CONTRACT(ABI, ADDRESS);

// FUNÇÃO PARA VERIFICAR O SALDO DO USUÁRIO NO CONTRATO DARKCOIN
ASYNC FUNCTION CHECKBALANCE() {
    TRY {
        CONST BALANCE = AWAIT DARKCOINCONTRACT.METHODS.BALANCEOF(USERADDRESS).CALL();
        RETORNA WEB3.UTILS.FROMWEI(BALANCE, 'ETHER'); // CONVERTE DE WEI PARA ETHER
    } CATCH (ERROR) {
        LANÇAR NOVO ERRO('ERRO AO VERIFICAR SALDO: ' + ERROR.MESSAGE);
    }
}

// FUNÇÃO PARA TRANSFERIR DARKCOIN PARA OUTRO ENDEREÇO
ASYNC FUNCTION TRANSFERDARKCOIN(TOADDRESS, AMOUNT) {
    IF (!WEB3.UTILS.ISADDRESS(TOADDRESS)) {
        LANÇAR NOVO ERRO('ENDEREÇO INVÁLIDO');
    }
    IF (ISNAN(AMOUNT) || AMOUNT <= 0) {
        LANÇAR NOVO ERRO('QUANTIDADE INVÁLIDA');
    }
    CONST AMOUNTINWEI = WEB3.UTILS.TOWEI(AMOUNT.TOSTRING(), 'ETHER');
    TRY {
        CONST TX = AWAIT DARKCOINCONTRACT.METHODS.TRANSFER(TOADDRESS, AMOUNTINWEI).SEND({ FROM: USERADDRESS });
        RETORNA TX;
    } CATCH (ERROR) {
        LANÇAR NOVO ERRO('ERRO AO TRANSFERIR TOKENS: ' + ERROR.MESSAGE);
    }
}

// FUNÇÃO PARA MINTAR NOVOS TOKENS
ASYNC FUNCTION MINTTOKENS(AMOUNT) {
    IF (ISNAN(AMOUNT) || AMOUNT <= 0) {
        LANÇAR NOVO ERRO('QUANTIDADE INVÁLIDA');
    }
    CONST AMOUNTINWEI = WEB3.UTILS.TOWEI(AMOUNT.TOSTRING(), 'ETHER');
    TRY {
        // VERIFICAÇÃO PARA GARANTIR QUE SOMENTE O ENDEREÇO AUTORIZADO PODE MINTAR
        CONST ISAUTHORIZED = AWAIT ISAUTHORIZEDTOMINT(USERADDRESS);
        IF (!ISAUTHORIZED) {
            LANÇAR NOVO ERRO('VOCÊ NÃO TEM PERMISSÃO PARA MINTAR TOKENS.');
        }
        CONST TX = AWAIT DARKCOINCONTRACT.METHODS.MINT(USERADDRESS, AMOUNTINWEI).SEND({ FROM: USERADDRESS });
        RETORNA TX;
    } CATCH (ERROR) {
        LANÇAR NOVO ERRO('ERRO AO MINTEAR TOKENS: ' + ERROR.MESSAGE);
    }
}

// FUNÇÃO DE VERIFICAÇÃO DE AUTORIZAÇÃO PARA MINTAGEM
ASYNC FUNCTION ISAUTHORIZEDTOMINT(ADDRESS) {
    // SUPONDO QUE O CONTRATO POSSUA UMA FUNÇÃO OWNER() QUE RETORNE O ENDEREÇO DO DONO
    TRY {
        CONST OWNERADDRESS = AWAIT DARKCOINCONTRACT.METHODS.OWNER().CALL();
        RETORNA ADDRESS === OWNERADDRESS;
    } CATCH (ERROR) {
        LANÇAR NOVO ERRO('ERRO NA VERIFICAÇÃO DE AUTORIZAÇÃO: ' + ERROR.MESSAGE);
    }
}

// FUNÇÃO PARA CRIAR COBRANÇA PIX
ASYNC FUNCTION CREATEPIXCHARGE(CHAVEPIX, VALOR, PLANO) {
    TRY {
        CONST RESPONSE = AWAIT AXIOS.POST(`${PIXAPIURL}/COBRANCA`, {
            CHAVE: CHAVEPIX,
            VALOR: VALOR,
            DESCRICAO: `PAGAMENTO PARA O PLANO ${PLANO}`,
        }, {
            HEADERS: {
                'AUTHORIZATION': `BEARER ${PROCESS.ENV.PIX_API_KEY}`
            }
        });
        RETORNA RESPONSE.DATA.QRCODE;  // SUPÕE QUE A RESPOSTA CONTENHA O QR CODE
    } CATCH (ERROR) {
        LANÇAR NOVO ERRO('ERRO AO CRIAR COBRANÇA PIX: ' + ERROR.MESSAGE);
    }
}

// ROTA PARA GERAR COBRANÇA PIX
APP.POST('/CRIAR-COBRANCA-PIX', ASYNC (REQ, RES) => {
    CONST { CHAVEPIX, VALOR, PLANO } = REQ.BODY;
    IF (!CHAVEPIX || !VALOR || !PLANO) {
        RETORNA RES.STATUS(400).JSON({ ERRO: 'FALTAM INFORMAÇÕES PARA GERAR A COBRANÇA' });
    }

    TRY {
        // VERIFICA SE O USUÁRIO TEM SALDO SUFICIENTE
        CONST SALDO = AWAIT CHECKBALANCE();
        IF (PARSEFLOAT(SALDO) < VALOR) {
            RETORNA RES.STATUS(400).JSON({ ERRO: 'SALDO INSUFICIENTE' });
        }

        // CRIA A COBRANÇA PIX
        CONST QRCODEDATA = AWAIT CREATEPIXCHARGE(CHAVEPIX, VALOR, PLANO);
        RES.JSON({ QRCODE: QRCODEDATA });
    } CATCH (ERROR) {
        CONSOLE.ERRO('ERRO AO CRIAR COBRANÇA PIX:', ERROR);
        RES.STATUS(500).JSON({ ERRO: 'ERRO AO CRIAR COBRANÇA PIX' });
    }
});

// ROTA PARA VERIFICAR O SALDO DA DARKCOIN
APP.GET('/CHECK-BALANCE', ASYNC (REQ, RES) => {
    TENTAR {
        CONST BALANCE = AWAIT CHECKBALANCE();
        RES.JSON({ BALANCE });
    } CATCH (ERROR) {
        RES.STATUS(500).JSON({ ERRO: 'ERRO AO VERIFICAR SALDO' });
    }
});

// ROTA PARA TRANSFERIR DARKCOIN
APP.POST('/TRANSFER-DARKCOIN', ASYNC (REQ, RES) => {
    CONST { TOADDRESS, AMOUNT } = REQ.BODY;
    IF (!WEB3.UTILS.ISADDRESS(TOADDRESS) || !AMOUNT) {
        RETORNA RES.STATUS(400).JSON({ ERRO: 'ENDEREÇO OU VALOR INVÁLIDO' });
    }
    TRY {
        CONST TX = AWAIT TRANSFERDARKCOIN(TOADDRESS, AMOUNT);
        RES.JSON({ TX });
    } CATCH (ERROR) {
        RES.STATUS(500).JSON({ ERRO: 'ERRO AO TRANSFERIR TOKENS' });
    }
});

// ROTA PARA MINTAR NOVOS TOKENS
APP.POST('/MINT-TOKENS', ASYNC (REQ, RES) => {
    CONST { AMOUNT } = REQ.BODY;
    IF (!AMOUNT) {
        RETORNA RES.STATUS(400).JSON({ ERRO: 'VALOR PARA MINTEAGEM NÃO ESPECIFICADO' });
    }
    TRY {
        CONST TX = AWAIT MINTTOKENS(AMOUNT);
        RES.JSON({ TX });
    } CATCH (ERROR) {
        RES.STATUS(500).JSON({ ERRO: 'ERRO AO MINTEAR TOKENS' });
    }
});

// INICIA O SERVIDOR NA PORTA 3000
APP.LISTEN(3000, () => {
    CONSOLE.LOG('SERVIDOR INICIADO NA PORTA 3000');
});

MODULE.EXPORTS = { CHECKBALANCE, TRANSFERDARKCOIN, MINTTOKENS };

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
// caps.js
const { applyTransactionFee } = require('./tax');  // Importa a função de taxa

app.post('/criar-cobranca-pix', async (req, res) => {
    const { chavePix, valor, plano } = req.body;
    if (!chavePix || !valor || !plano) {
        return res.status(400).json({ error: 'Faltam informações para gerar a cobrança' });
    }
    
    // Aplica a taxa de transação
    const valorComTaxa = applyTransactionFee(valor);  // Aplica a taxa de 5%

    try {
        // Envia a solicitação de cobrança Pix para a API do banco com o valor com a taxa
        const response = await axios.post(`${pixApiUrl}/cobranca`, {
            chave: chavePix,
            valor: valorComTaxa,  // Envia o valor com a taxa
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
  // caps.js
app.post('/transfer-darkcoin', async (req, res) => {
    const { toAddress, amount } = req.body;
    if (!web3.utils.isAddress(toAddress) || !amount) {
        return res.status(400).json({ error: 'Endereço ou valor inválido' });
    }

    // Aplica a taxa de transação
    const amountWithFee = applyTransactionFee(amount);  // Aplica a taxa de 5%

    try {
        const tx = await transferDarkCoin(toAddress, amountWithFee);  // Usa o valor com taxa
        res.json({ tx });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao transferir tokens' });
    }
});
// caps.js
app.post('/mint-tokens', async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ error: 'Valor para mintagem não especificado' });
    }

    // Aplica a taxa de transação
    const amountWithFee = applyTransactionFee(amount);  // Aplica a taxa de 5%

    try {
        const tx = await mintTokens(amountWithFee);  // Usa o valor com taxa
        res.json({ tx });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao mintear tokens' });
    }
});

});

