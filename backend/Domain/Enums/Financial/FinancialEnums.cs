namespace Domain.Enums.Financial
{
    public enum CashflowDirection
    {
        In = 0,
        Out = 1
    }

    public enum CashflowCategory
    {
        OrderPayment = 0,
        OrderDeposit = 1,
        CodReceipt = 2,
        Refund = 3,
        SupplierPayment = 4,
        Payroll = 5,
        Marketing = 6,
        Operating = 7,
        Debt = 8,
        Other = 9
    }

    public enum ExpenseCategory
    {
        Operating = 0,
        Payroll = 1,
        Marketing = 2,
        Debt = 3,
        Other = 4,
        Supplier = 5,
        Defective = 6
    }

    public enum IncomeType
    {
        Sale = 0,
        RefundAdjustment = 1
    }
}
