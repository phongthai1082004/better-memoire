using Domain.Entities.Orders;
using Domain.Entities.Suppliers;
using Domain.Entities.Users;
using Domain.Enums.Orders;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class OrderConfiguration : AuditableEntityConfiguration<Order>
    {
        public override void Configure(EntityTypeBuilder<Order> builder)
        {
            base.Configure(builder);

            builder.ToTable("orders");
            builder.Ignore(o => o.DomainEvents);

            builder.Property(o => o.OrderCode).HasMaxLength(50);
            builder.HasIndex(o => o.OrderCode).IsUnique();

            builder.Property(o => o.Status).IsRequired().HasConversion<int>();
            builder.Property(o => o.PaymentType).IsRequired().HasConversion<int>();

            builder.Property(o => o.Name).HasMaxLength(150);
            builder.Property(o => o.Phone).HasMaxLength(30);
            builder.Property(o => o.Province).HasMaxLength(150);
            builder.Property(o => o.District).HasMaxLength(150);
            builder.Property(o => o.Ward).HasMaxLength(150);
            builder.Property(o => o.Address).HasMaxLength(300);

            builder.Property(o => o.Carrier).HasMaxLength(100);
            builder.Property(o => o.ShippingMethod).HasMaxLength(100);
            builder.Property(o => o.TrackingCode).HasMaxLength(100);
            builder.HasIndex(o => o.TrackingCode)
                .IsUnique()
                .HasFilter("\"TrackingCode\" IS NOT NULL");

            builder.Property(o => o.SupplierOrderCode).HasMaxLength(100);
            builder.Property(o => o.QrCode).HasMaxLength(2000);
            builder.Property(o => o.CheckoutUrl).HasMaxLength(2000);

            builder.Property(o => o.CustomerNote).HasMaxLength(1000);
            builder.Property(o => o.InternalNote).HasMaxLength(1000);
            builder.Property(o => o.CancelReason).HasMaxLength(500);

            builder.Property(o => o.InvoiceCompany).HasMaxLength(200);
            builder.Property(o => o.InvoiceTaxCode).HasMaxLength(50);
            builder.Property(o => o.InvoiceEmail).HasMaxLength(256);

            builder.Property(o => o.UtmSource).HasMaxLength(64);
            builder.Property(o => o.UtmMedium).HasMaxLength(64);
            builder.Property(o => o.UtmCampaign).HasMaxLength(128);

            builder.HasIndex(o => new { o.UserId, o.CreatedOnUtc });
            builder.HasIndex(o => o.Status);
            builder.HasIndex(o => o.SupplierId);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<Supplier>()
                .WithMany()
                .HasForeignKey(o => o.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(o => o.Items)
                .WithOne()
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(o => o.StatusHistory)
                .WithOne()
                .HasForeignKey(h => h.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
