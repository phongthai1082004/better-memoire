using Domain.Abstractions.Entities;
using Domain.Enums.Financial;
using Domain.Enums.Orders;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Financial
{
    /// <summary>
    /// Expense record. PaymentStatus changes Unpaid → Paid, but the row is never deleted.
    /// </summary>
    public class Expense : AggregateRoot, IImmutableEntity
    {
        public Guid? OrderId { get; private set; }
        public Guid? SupplierId { get; private set; }
        public ExpenseCategory Category { get; private set; }
        public int Amount { get; private set; }
        public DateTimeOffset Date { get; private set; }
        public PaymentStatus PaymentStatus { get; private set; } = PaymentStatus.Unpaid;
        public DateTimeOffset? PaidAt { get; private set; }
        public string? Description { get; private set; }
        public string? SupplierName { get; private set; }
        public string? AttachmentUrl { get; private set; }
        public string? Note { get; private set; }

        private Expense()
        {
        }

        public Expense(
            ExpenseCategory category,
            int amount,
            DateTimeOffset date,
            Guid? orderId = null,
            Guid? supplierId = null,
            PaymentStatus paymentStatus = PaymentStatus.Unpaid,
            string? description = null,
            string? supplierName = null,
            string? attachmentUrl = null,
            string? note = null)
        {
            if (amount <= 0)
                throw new DomainRuleException(ErrorCode.ExpenseAmountPositive);

            Category = category;
            Amount = amount;
            Date = date;
            OrderId = orderId;
            SupplierId = supplierId;
            PaymentStatus = paymentStatus;
            Description = description;
            SupplierName = supplierName;
            AttachmentUrl = attachmentUrl;
            Note = note;
        }

        public void MarkPaid(DateTimeOffset at)
        {
            PaymentStatus = PaymentStatus.Paid;
            PaidAt = at;
        }

        public void MarkUnpaid()
        {
            PaymentStatus = PaymentStatus.Unpaid;
            PaidAt = null;
        }

        public void AttachAttachment(string? url) => AttachmentUrl = url;
    }
}
