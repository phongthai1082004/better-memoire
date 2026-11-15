using Domain.Entities.Financial;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class FinancePeriodConfiguration : AuditableEntityConfiguration<FinancePeriod>
    {
        public override void Configure(EntityTypeBuilder<FinancePeriod> builder)
        {
            base.Configure(builder);

            builder.ToTable("finance_periods");

            builder.Property(p => p.Id).HasColumnName("Period").HasMaxLength(7).ValueGeneratedNever();
            builder.Property(p => p.TotalOrders).HasDefaultValue(0);
            builder.Property(p => p.TotalRevenue).HasDefaultValue(0L);
            builder.Property(p => p.TotalExpense).HasDefaultValue(0L);
            builder.Property(p => p.TotalSupplierExpense).HasDefaultValue(0L);
            builder.Property(p => p.CashInflow).HasDefaultValue(0L);
            builder.Property(p => p.CashOutflow).HasDefaultValue(0L);
            builder.Property(p => p.TotalProfit).HasDefaultValue(0L);
            builder.Property(p => p.CashOnHand).HasDefaultValue(0L);
            builder.Property(p => p.Receivables).HasDefaultValue(0L);
            builder.Property(p => p.Payables).HasDefaultValue(0L);
            builder.Property(p => p.IsClosed).HasDefaultValue(false);
        }
    }
}
