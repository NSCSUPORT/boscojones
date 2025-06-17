// backend.js
const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Dados em memória (troque para DB real depois)
let saldo = 0;
let historico = [];

function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// GET saldo
app.get("/api/saldo", (req, res) => {
  res.json({ saldo });
});

// POST depositar
app.post("/api/depositar", (req, res) => {
  const { valor } = req.body;
  if (!valor || valor <= 0) return res.status(400).json({ error: "Valor inválido" });

  saldo += valor;
  historico.unshift({ type: "deposit", amount: valor, date: new Date() });
  res.json({ saldo });
});

// POST sacar
app.post("/api/sacar", (req, res) => {
  const { valor, chavePix } = req.body;
  if (!valor || valor <= 0) return res.status(400).json({ error: "Valor inválido" });
  if (!chavePix || chavePix.trim() === "") return res.status(400).json({ error: "Chave Pix é obrigatória" });
  if (valor > saldo) return res.status(400).json({ error: "Saldo insuficiente" });

  saldo -= valor;
  historico.unshift({ type: "withdraw", amount: valor, chavePix, date: new Date() });
  res.json({ saldo });
});

// POST criar-cobranca (gera Pix QR code fake)
app.post("/api/criar-cobranca", async (req, res) => {
  const { valor } = req.body;
  if (!valor || valor <= 0) return res.status(400).json({ error: "Valor inválido" });
  if (valor > saldo) return res.status(400).json({ error: "Saldo insuficiente para gerar cobrança" });

  // Exemplo de payload Pix simplificado para QRCode
  const pixPayload = `00020126580014BR.GOV.BCB.PIX0114+558199999999520400005303986540${parseFloat(valor).toFixed(2).replace('.', '')}5802BR5925Nome do Recebedor6009SAO PAULO61080540900062070503***6304`;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(pixPayload);

    // Diminuir saldo ao gerar Pix (simula que você 'enviou' o valor)
    saldo -= valor;
    historico.unshift({ type: "pix", amount: valor, date: new Date() });

    res.json({ qrcode: pixPayload, imagemQrcode: qrCodeDataURL });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar QR Code" });
  }
});

// Servidor
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
