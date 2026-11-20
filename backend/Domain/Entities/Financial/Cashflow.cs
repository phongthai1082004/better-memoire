using Domain.Abstractions.Entities;
using Domain.Enums.Financial;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Financial
{
    /// <summary>
    /// Append-only cash ledger entry. Amount is always positive; direction decides the sign.
    /// Corrections are new rows pointing at the original through <see cref="ReversalOfId"/>.
    /// </summary>
    public class Cashflow : AggregateRoot, IImmutableEntity
    {
        public CashflowDirection Direction { get; private set; }
        public CashflowCategory Category { get; private set; }
        public int Amount { get; private set; }
        public DateTimeOffset Date { get; private set; }
        public Guid? TransactionId { get; private set; }
        public Guid? OrderId { get; private set; }
        public Guid? ExpenseId { get; private set; }
        public Guid? SupplierId { get; private set; }
        public Guid? ReversalOfId { get; private set; }
        public string? Note { get; private set; }

        private Cashflow()
        {
        }

        public Cashflow(CashflowDirection direction, CashflowCategory category, int amount, DateTimeOffset date, Guid? transactionId = null, Guid? orderId = null, Guid? expenseId = null, Guid? supplierId = null, Guid? reversalOfId = null, string? note = null)
        {
            if (amount <= 0)
                throw new DomainRuleException(ErrorCode.CashflowAmountPositive);

            Direction = direction;
            Category = category;
            Amount = amount;
            Date = date;
            TransactionId = transactionId;
            OrderId = orderId;
            ExpenseId = expenseId;
            SupplierId = supplierId;
            ReversalOfId = reversalOfId;
            Note = note;
        }
    }
}
