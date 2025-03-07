document.getElementById('payment-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Gerar o código de pagamento (apenas um exemplo de código gerado aleatoriamente)
    const paymentCode = 'CODE-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Exibir o código de pagamento e o QR Code
    document.getElementById('qrcode-container').style.display = 'block';
    document.getElementById('qrcode').textContent = paymentCode;
});
