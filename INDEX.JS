const { gerarCoberturaPix } = require('./pix');

async function main() {
  try {
    const dadosPix = {
      valor: 100,
      chave: 'seu-email-ou-celular-ou-cpf',
      descricao: 'Pagamento de teste',
      // outros dados conforme API Pix
    };

    const resposta = await gerarCoberturaPix(dadosPix);
    console.log('Cobrança gerada:', resposta);
  } catch (error) {
    console.error('Erro no Pix:', error.response?.data || error.message);
  }
}

main();
