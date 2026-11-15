using Domain.Abstractions.Entities;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Financial
{
    /// <summary>
    /// Read model maintained by database triggers, one row per <c>YYYY-MM</c> (Asia/Ho_Chi_Minh).
    /// <see cref="IsClosed"/> locks a past period against trigger rewrites.
    /// </summary>
    public class FinancePeriod : BaseEntity<string>, IImmutableEntity
    {
        public int TotalOrders { get; private set; }
        public long TotalRevenue { get; private set; }
        public long TotalExpense { get; private set; }
        public long TotalSupplierExpense { get; private set; }
        public long CashInflow { get; private set; }
        public long CashOutflow { get; private set; }
        public long TotalProfit { get; private set; }
        public long CashOnHand { get; private set; }
        public long Receivables { get; private set; }
        public long Payables { get; private set; }
        public bool IsClosed { get; private set; }
        public DateTimeOffset? ClosedAt { get; private set; }

        private FinancePeriod()
        {
        }

        public FinancePeriod(string period)
        {
            if (period.Length != 7 || period[4] != '-')
                throw new DomainRuleException(ErrorCode.FinancePeriodFormat);

            Id = period;
        }

        public void Close(DateTimeOffset at)
        {
            IsClosed = true;
            ClosedAt = at;
        }

        public void Reopen()
        {
            IsClosed = false;
            ClosedAt = null;
        }
    }
}
