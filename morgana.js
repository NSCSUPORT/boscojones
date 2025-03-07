// Importando as dependências
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuração do servidor
const app = express();
const cache = redis.createClient();
app.use(bodyParser.json());
app.use(morgan('combined')); // Log de todas as requisições

// Variáveis de ambiente
require('dotenv').config();

// Definição de URLs e contratuais
const pixApiUrl = 'https://api.banco.com.br/pix';  // URL da API do Banco que suporta Pix
const darkCoinAddress = '0xYourDarkCoinAddress'; // Endereço do contrato DarkCoin
const darkCoinAbi = [/* ABI do contrato DarkCoin */];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Morgana - DarkCoin',
      version: '1.0.0',
      description: 'API para interagir com a blockchain DarkCoin e outras funcionalidades.',
    },
  },
  apis: ['./morgana.js'], // Caminho para o arquivo de documentação
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Middleware de autenticação JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(403).send('Acesso negado.');
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Token inválido.');
    }
    req.user = user;
    next();
  });
};

// Gerar token JWT
const generateToken = (user) => {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Endpoint para criação de cobrança Pix
app.post('/criar-cobranca-pix', async (req, res) => {
  const { chavePix, valor, plano } = req.body;

  // Validação de entrada
  if (!chavePix || !valor || !plano) {
    return res.status(400).json({ error: 'Faltam informações para gerar a cobrança' });
  }

  try {
    // Envia a solicitação de cobrança Pix para a API bancária
    const response = await axios.post(`${pixApiUrl}/cobrança`, {
      chave: chavePix,
      valor: valor,
      descricao: `Pagamento para o plano ${plano}`,
    });

    const qrCodeData = response.data.qrCode;
    res.json({ qrCode: qrCodeData });
  } catch (error) {
    console.error('Erro ao criar cobrança Pix:', error);
    res.status(500).json({ error: 'Erro ao criar cobrança Pix' });
  }
});

// Endpoint para verificar saldo usando cache (Redis)
app.get('/check-balance', authenticateJWT, async (req, res) => {
  const userAddress = req.user.address;
  const cachedBalance = await cache.getAsync(userAddress);

  if (cachedBalance) {
    return res.json({ balance: cachedBalance });
  }

  try {
    // Aqui você interage com o contrato DarkCoin (substitua por sua lógica)
    const balance = 1000; // Exemplo de saldo fixo
    const balanceInEther = balance / 10**18;  // Converte de Wei para Ether
    cache.setex(userAddress, 3600, balanceInEther); // Cache por 1 hora
    res.json({ balance: balanceInEther });
  } catch (error) {
    console.error('Erro ao verificar saldo:', error);
    res.status(500).json({ error: 'Erro ao verificar saldo' });
  }
});

// Endpoint de transferência de DarkCoin
app.post('/transfer', authenticateJWT, [
  body('toAddress').isLength({ min: 42, max: 42 }).withMessage('Endereço inválido'),
  body('amount').isNumeric().withMessage('Quantidade deve ser um número válido'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { toAddress, amount } = req.body;

  try {
    // Lógica para transferir DarkCoin (substitua pela chamada real ao contrato)
    console.log(`Transferindo ${amount} DarkCoin para ${toAddress}`);
    res.json({ message: 'Transferência realizada com sucesso' });
  } catch (error) {
    console.error('Erro ao realizar transferência:', error);
    res.status(500).json({ error: 'Erro ao realizar transferência' });
  }
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('Servidor de API Morgana iniciado na porta 3000');
});
