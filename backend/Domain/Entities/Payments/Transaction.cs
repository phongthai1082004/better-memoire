using Domain.Abstractions.Entities;
using Domain.Enums.Payments;

namespace Domain.Entities.Payments
{
    /// <summary>
    /// Gateway transaction. Never deleted; a refund is a new transaction linked through
    /// <see cref="RefundOfTransactionId"/>.
    /// </summary>
    public class Transaction : AggregateRoot, IImmutableEntity
    {
        public Guid? OrderId { get; private set; }
        public string? IdempotencyKeyId { get; private set; }
        public Guid? RefundOfTransactionId { get; private set; }
        public string Gateway { get; private set; } = string.Empty;
        public string? GatewayTransactionCode { get; private set; }
        public TransactionType Type { get; private set; }
        public TransactionStatus Status { get; private set; } = TransactionStatus.Pending;
        public int Amount { get; private set; }
        public string Currency { get; private set; } = "VND";
        public string? PaymentLinkId { get; private set; }
        public string? BankAccount { get; private set; }
        public string? Content { get; private set; }
        public string? Reference { get; private set; }
        public string? FailureReason { get; private set; }
        public DateTimeOffset TransactionTime { get; private set; }
        public string? RawPayload { get; private set; }
        public DateTimeOffset? ReconciledAt { get; private set; }

        private Transaction()
        {
        }

        public Transaction(
            string gateway,
            TransactionType type,
            int amount,
            DateTimeOffset transactionTime,
            Guid? orderId = null,
            string? gatewayTransactionCode = null,
            string? idempotencyKeyId = null,
            Guid? refundOfTransactionId = null,
            string? paymentLinkId = null,
            string currency = "VND")
        {
            if (amount < 0)
                throw new ArgumentOutOfRangeException(nameof(amount));

            Gateway = gateway;
            Type = type;
            Amount = amount;
            TransactionTime = transactionTime;
            OrderId = orderId;
            GatewayTransactionCode = gatewayTransactionCode;
            IdempotencyKeyId = idempotencyKeyId;
            RefundOfTransactionId = refundOfTransactionId;
            PaymentLinkId = paymentLinkId;
            Currency = currency;
        }

        public void MarkSuccess(string? reference, string? bankAccount, string? rawPayload, DateTimeOffset at)
        {
            Status = TransactionStatus.Success;
            Reference = reference;
            BankAccount = bankAccount;
            RawPayload = rawPayload;
            TransactionTime = at;
        }

        public void MarkFailed(string? reason, string? rawPayload, DateTimeOffset at)
        {
            Status = TransactionStatus.Failed;
            FailureReason = reason;
            RawPayload = rawPayload;
            TransactionTime = at;
        }

        public void Cancel(string? reason, DateTimeOffset at)
        {
            Status = TransactionStatus.Cancelled;
            FailureReason = reason;
            TransactionTime = at;
        }

        public void MarkRefunded(DateTimeOffset at)
        {
            Status = TransactionStatus.Refunded;
            TransactionTime = at;
        }

        public void Reconcile(DateTimeOffset at) => ReconciledAt = at;

        public void AttachPaymentLink(string? paymentLinkId) => PaymentLinkId = paymentLinkId ?? PaymentLinkId;
    }
}
