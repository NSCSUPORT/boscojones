// index.js

document.addEventListener('DOMContentLoaded', function() {
    const planoSelecionado = "Plano Exemplo"; // Exemplo, substituir com o valor do plano selecionado
    const valorInvestido = 100.00; // Substituir com o valor do investimento

    const btnPagar = document.getElementById("btn-pagar"); // Supondo que há um botão "Pagar" no HTML

    btnPagar.addEventListener('click', function() {
        // Envia os dados para o servidor para criar o pagamento
        fetch('http://localhost:3000/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plano: planoSelecionado,
                valor: valorInvestido
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Se a API devolver um link de pagamento ou QR code
            if (data.init_point) {
                // Caso seja um link de pagamento
                window.location.href = data.init_point;  // Redireciona para o link de pagamento
            } else if (data.qr_code_url) {
                // Caso seja um QR Code
                displayQRCode(data.qr_code_url);  // Exibe o QR code na página
            } else {
                alert('Erro: Não foi possível gerar o pagamento.');
            }
        })
        .catch(error => {
            console.error('Erro ao criar pagamento:', error);
            alert('Erro ao processar pagamento');
        });
    });

    // Função para exibir o QR code na página
    function displayQRCode(qrCodeUrl) {
        const qrCodeContainer = document.getElementById("qr-code-container");
        const img = document.createElement("img");
        img.src = qrCodeUrl;
        img.alt = "QR Code";
        qrCodeContainer.innerHTML = '';  // Limpa qualquer conteúdo anterior
        qrCodeContainer.appendChild(img);  // Adiciona o QR code à página
    }
});
