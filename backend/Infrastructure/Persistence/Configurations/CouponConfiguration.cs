using Domain.Entities.Coupons;
using Domain.Enums.Coupons;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class CouponConfiguration : SoftDeleteEntityConfiguration<Coupon>
    {
        public override void Configure(EntityTypeBuilder<Coupon> builder)
        {
            base.Configure(builder);

            builder.ToTable("coupons");
            builder.Ignore(c => c.DomainEvents);

            builder.Property(c => c.Code).HasMaxLength(50).IsRequired();
            builder.HasIndex(c => c.Code)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            builder.Property(c => c.Description).HasMaxLength(500);
            builder.Property(c => c.DiscountType).IsRequired().HasConversion<int>();
            builder.Property(c => c.MinOrderType).IsRequired().HasConversion<int>();
            builder.Property(c => c.MaxUsageCount).HasDefaultValue(0);
            builder.Property(c => c.MaxUsagePerUser).HasDefaultValue(0);
            builder.Property(c => c.UsedCount).HasDefaultValue(0);
            builder.Property(c => c.FirstOrderOnly).HasDefaultValue(false);
            builder.Property(c => c.IsActive).HasDefaultValue(true);

            builder.HasIndex(c => new { c.IsActive, c.ExpiresAt });
        }
    }
}
