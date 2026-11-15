namespace Domain.Enums.Orders
{
    public enum OrderStatus
    {
        PendingPayment = 0,
        DepositPaid = 1,
        Paid = 2,
        Processing = 3,
        Printing = 4,
        Shipping = 5,
        Delivered = 6,
        Completed = 7,
        Cancelled = 8
    }

    public enum PaymentType
    {
        FullPayment = 0,
        HalfPayment = 1,
        Cod = 2
    }

    public enum PaymentStatus
    {
        Unpaid = 0,
        Paid = 1
    }

    public enum ReturnState
    {
        None = 0,
        Requested = 1,
        Approved = 2,
        Reshipping = 3,
        Reshipped = 4,
        Refunding = 5,
        Refunded = 6
    }

    public enum DefectState
    {
        None = 0,
        Reported = 1,
        Resolved = 2
    }

    public enum ReturnFault
    {
        Self = 0,
        Supplier = 1
    }
}
