using Domain.Abstractions.Entities;
using Domain.Enums.Financial;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Financial
{
    /// <summary>
    /// Recognised revenue. Recognition happens when the order is completed/delivered.
    /// <see cref="Amount"/> may be negative for <see cref="IncomeType.RefundAdjustment"/>.
    /// </summary>
    public class Income : AggregateRoot, IImmutableEntity
    {
        public Guid? OrderId { get; private set; }
        public IncomeType Type { get; private set; }
        public int Amount { get; private set; }
        public DateTimeOffset RecognizedAt { get; private set; }
        public string? Note { get; private set; }

        private Income()
        {
        }

        public Income(IncomeType type, int amount, DateTimeOffset recognizedAt, Guid? orderId = null, string? note = null)
        {
            if (type == IncomeType.Sale && amount < 0)
                throw new DomainRuleException(ErrorCode.IncomeSaleNotNegative);

            Type = type;
            Amount = amount;
            RecognizedAt = recognizedAt;
            OrderId = orderId;
            Note = note;
        }
    }
}
