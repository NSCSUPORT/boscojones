// Exemplo de contrato HoloFi
pragma solidity ^0.8.0;

contract HoloFiPayment {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function receivePayment() public payable {
        require(msg.value > 0, "Pagamento deve ser maior que zero.");
    }

    // Retornar saldo do contrato
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
