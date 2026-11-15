using Domain.Entities.Financial;
using Domain.Entities.Orders;
using Domain.Entities.Suppliers;
using Domain.Enums.Financial;
using Domain.Enums.Orders;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class ExpenseConfiguration : AuditableEntityConfiguration<Expense>
    {
        public override void Configure(EntityTypeBuilder<Expense> builder)
        {
            base.Configure(builder);

            builder.ToTable("expenses");
            builder.Ignore(e => e.DomainEvents);

            builder.Property(e => e.Category).IsRequired().HasConversion<int>();
            builder.Property(e => e.Amount).IsRequired();
            builder.Property(e => e.Date).IsRequired();
            builder.Property(e => e.PaymentStatus).IsRequired().HasConversion<int>();
            builder.Property(e => e.Description).HasMaxLength(1000);
            builder.Property(e => e.SupplierName).HasMaxLength(200);
            builder.Property(e => e.AttachmentUrl).HasMaxLength(1000);
            builder.Property(e => e.Note).HasMaxLength(1000);

            builder.HasIndex(e => e.Date);
            builder.HasIndex(e => new { e.Category, e.Date });
            builder.HasIndex(e => new { e.SupplierId, e.PaymentStatus });

            builder.HasOne<Order>()
                .WithMany()
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Supplier>()
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
