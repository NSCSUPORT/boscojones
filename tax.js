module.exports = { applyTransactionFee };// tax.js
module.exports.applyTransactionFee = (value) => {
    const transactionFee = 0.05; // Taxa de 5% (pode ser configurável)
    const valueWithFee = value * (1 + transactionFee); // Aplica a taxa de 5%
    return valueWithFee;
};
