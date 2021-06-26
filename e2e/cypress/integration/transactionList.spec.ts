function newTransactionFromScratch(
    {desc, from, to, amount}: { desc: string, from: string, to: string, amount: number }) {
    cy.get('[data-cy=transaction-entry-description]').type(desc);
    cy.get('[data-cy=transaction-entry-from]').type(from);
    cy.get('[data-cy=transaction-entry-to]').type(to);
    cy.get('[data-cy=transaction-entry-amount]').type(amount.toString());
    cy.get('[data-cy=transaction-entry-save]').click();

    cy.contains('Account summary');
    cy.get(`[data-cy="transaction-account-${from}"]`).then(($line) => {
        const actualAmount = parseFloat(($line.find('[data-cy=amount]').text()).replace('$', ''));
        expect(actualAmount).to.not.greaterThan(-amount);
    });
    cy.get(`[data-cy=transaction-account-${to}]`).then(($line) => {
        const actualAmount = parseFloat(($line.find('[data-cy=amount]').text()).replace('$', ''));
        expect(actualAmount).to.not.lessThan(amount);
    });
}

describe('TransactionList', function () {
    it('should create new transaction', function () {
        cy.visit('/');
        cy.contains('Transaction').click();
        cy.contains('New transaction').click();

        newTransactionFromScratch({
            desc: 'Fancy restaurant',
            from: 'Credit card',
            to: 'Grocery',
            amount: 15
        });

        cy.contains('Close').click();
    });

});