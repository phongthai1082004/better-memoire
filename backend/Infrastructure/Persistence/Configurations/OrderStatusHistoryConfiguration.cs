using Domain.Entities.Orders;
using Domain.Entities.Users;
using Domain.Enums.Orders;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class OrderStatusHistoryConfiguration : AuditableEntityConfiguration<OrderStatusHistory>
    {
        public override void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
        {
            base.Configure(builder);

            builder.ToTable("order_status_histories");

            builder.Property(h => h.FromStatus).HasConversion<int>();
            builder.Property(h => h.ToStatus).IsRequired().HasConversion<int>();
            builder.Property(h => h.Note).HasMaxLength(1000);

            builder.HasIndex(h => new { h.OrderId, h.CreatedOnUtc });

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(h => h.ChangedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
