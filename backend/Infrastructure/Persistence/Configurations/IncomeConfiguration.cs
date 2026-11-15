using Domain.Entities.Financial;
using Domain.Entities.Orders;
using Domain.Enums.Financial;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class IncomeConfiguration : AuditableEntityConfiguration<Income>
    {
        public override void Configure(EntityTypeBuilder<Income> builder)
        {
            base.Configure(builder);

            builder.ToTable("incomes");
            builder.Ignore(i => i.DomainEvents);

            builder.Property(i => i.Type).IsRequired().HasConversion<int>();
            builder.Property(i => i.Amount).IsRequired();
            builder.Property(i => i.RecognizedAt).IsRequired();
            builder.Property(i => i.Note).HasMaxLength(1000);

            // Partial unique index: one SALE income per order.
            builder.HasIndex(i => i.OrderId)
                .IsUnique()
                .HasFilter("\"Type\" = 0 AND \"OrderId\" IS NOT NULL");

            builder.HasIndex(i => i.RecognizedAt);

            builder.HasOne<Order>()
                .WithMany()
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
