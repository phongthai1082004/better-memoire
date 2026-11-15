using Domain.Entities.Idempotency;
using Domain.Entities.Orders;
using Domain.Entities.Payments;
using Domain.Enums.Payments;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class TransactionConfiguration : AuditableEntityConfiguration<Transaction>
    {
        public override void Configure(EntityTypeBuilder<Transaction> builder)
        {
            base.Configure(builder);

            builder.ToTable("transactions");
            builder.Ignore(t => t.DomainEvents);

            builder.Property(t => t.Gateway).HasMaxLength(50).IsRequired();
            builder.Property(t => t.GatewayTransactionCode).HasMaxLength(200);
            builder.HasIndex(t => t.GatewayTransactionCode)
                .IsUnique()
                .HasFilter("\"GatewayTransactionCode\" IS NOT NULL");

            builder.Property(t => t.IdempotencyKeyId).HasMaxLength(255);
            builder.HasIndex(t => t.IdempotencyKeyId)
                .IsUnique()
                .HasFilter("\"IdempotencyKeyId\" IS NOT NULL");

            builder.Property(t => t.Type).IsRequired().HasConversion<int>();
            builder.Property(t => t.Status).IsRequired().HasConversion<int>();
            builder.Property(t => t.Currency).HasMaxLength(10).IsRequired().HasDefaultValue("VND");
            builder.Property(t => t.PaymentLinkId).HasMaxLength(200);
            builder.Property(t => t.BankAccount).HasMaxLength(100);
            builder.Property(t => t.Content).HasMaxLength(500);
            builder.Property(t => t.Reference).HasMaxLength(200);
            builder.Property(t => t.FailureReason).HasMaxLength(1000);
            builder.Property(t => t.RawPayload).HasColumnType("jsonb");

            builder.HasIndex(t => new { t.OrderId, t.Status });
            builder.HasIndex(t => t.TransactionTime);

            builder.HasOne<Order>()
                .WithMany()
                .HasForeignKey(t => t.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<IdempotencyRecord>()
                .WithOne()
                .HasForeignKey<Transaction>(t => t.IdempotencyKeyId)
                .HasPrincipalKey<IdempotencyRecord>(r => r.Key)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<Transaction>()
                .WithMany()
                .HasForeignKey(t => t.RefundOfTransactionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
