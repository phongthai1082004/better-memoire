using Domain.Entities.Coupons;
using Domain.Entities.Orders;
using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class CouponUsageConfiguration : AuditableEntityConfiguration<CouponUsage>
    {
        public override void Configure(EntityTypeBuilder<CouponUsage> builder)
        {
            base.Configure(builder);

            builder.ToTable("coupon_usages");

            builder.HasIndex(u => u.OrderId).IsUnique();
            builder.HasIndex(u => new { u.CouponId, u.UserId });

            builder.HasOne<Coupon>()
                .WithMany(c => c.Usages)
                .HasForeignKey(u => u.CouponId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<Order>()
                .WithMany()
                .HasForeignKey(u => u.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
