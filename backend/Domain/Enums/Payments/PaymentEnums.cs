namespace Domain.Enums.Payments
{
    public enum TransactionType
    {
        FullPayment = 0,
        Deposit = 1,
        Remaining = 2,
        Refund = 3,
        SupplierPayment = 4
    }

    public enum TransactionStatus
    {
        Pending = 0,
        Success = 1,
        Failed = 2,
        Cancelled = 3,
        Refunded = 4
    }
}
