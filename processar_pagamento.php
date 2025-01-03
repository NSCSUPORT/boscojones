<?php
require 'vendor/autoload.php';  // Certifique-se de que o autoload do Composer foi gerado corretamente

// Configuração do Mercado Pago
MercadoPago\SDK::setAccessToken('APP_USR-5426605333181809-010315-b06229d80c1e63ed582dbd28e27c677a-1658720398'); // Substitua pelo seu token de acesso

// Criação da preferência de pagamento
$preference = new MercadoPago\Preference();

// Itens do pagamento
$item = new MercadoPago\Item();
$item->title = 'Investimento - Zen BRL'; // Nome do plano ou item
$item->quantity = 1;
$item->unit_price = 100.00; // Valor do investimento (R$ 100)
$item->currency_id = 'BRL';

$preference->items = array($item);

// URL de retorno após pagamento (opcional)
$preference->back_urls = array(
    "success" => "https://www.seusite.com/success",
    "failure" => "https://www.seusite.com/failure",
    "pending" => "https://www.seusite.com/pending"
);

// Configura a opção de auto_return para 'approved' (opcional)
$preference->auto_return = 'approved';

// Criar o pagamento com PIX
$preference->payment_methods = array(
    "excluded_payment_types" => array(
        array("id" => "ticket") // Exclui o pagamento por boleto (caso queira permitir todos os métodos, remova essa linha)
    ),
    "installments" => 1, // Número de parcelas
);

// Salvar a preferência
$preference->save();

// Redirecionar para o link de pagamento
echo "<a href='" . $preference->init_point . "'>Clique aqui para realizar o pagamento via PIX</a>";
?>
