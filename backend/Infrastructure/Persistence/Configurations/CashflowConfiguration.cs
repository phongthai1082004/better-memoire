using Domain.Entities.Financial;
using Domain.Entities.Orders;
using Domain.Entities.Payments;
using Domain.Entities.Suppliers;
using Domain.Enums.Financial;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class CashflowConfiguration : AuditableEntityConfiguration<Cashflow>
    {
        public override void Configure(EntityTypeBuilder<Cashflow> builder)
        {
            base.Configure(builder);

            builder.ToTable("cashflows");
            builder.Ignore(c => c.DomainEvents);

            builder.Property(c => c.Direction).IsRequired().HasConversion<int>();
            builder.Property(c => c.Category).IsRequired().HasConversion<int>();
            builder.Property(c => c.Amount).IsRequired();
            builder.Property(c => c.Date).IsRequired();
            builder.Property(c => c.Note).HasMaxLength(1000);

            builder.HasIndex(c => c.Date);
            builder.HasIndex(c => new { c.Direction, c.Date });
            builder.HasIndex(c => c.Category);

            builder.HasOne<Transaction>()
                .WithMany()
                .HasForeignKey(c => c.TransactionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Order>()
                .WithMany()
                .HasForeignKey(c => c.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Expense>()
                .WithMany()
                .HasForeignKey(c => c.ExpenseId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Supplier>()
                .WithMany()
                .HasForeignKey(c => c.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Cashflow>()
                .WithMany()
                .HasForeignKey(c => c.ReversalOfId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
