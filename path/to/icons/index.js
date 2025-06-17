
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const registerRoute = require('./register');
const loginRoute = require('./login');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', registerRoute);
app.use('/api', loginRoute);

app.get('/', (req, res) => {
  res.send('API JBX1000 OK');
});

app.listen(PORT, () => {
  console.log(\`Servidor rodando em http://localhost:\${PORT}\`);
});
