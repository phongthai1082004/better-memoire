using Domain.Entities.Users;
using Domain.Enums.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : SoftDeleteEntityConfiguration<User>
    {
        public override void Configure(EntityTypeBuilder<User> builder)
        {
            base.Configure(builder);

            builder.ToTable("users");
            builder.Ignore(u => u.DomainEvents);

            builder.Property(u => u.Email).HasMaxLength(256);
            builder.HasIndex(u => u.Email)
                .IsUnique()
                .HasFilter("\"Email\" IS NOT NULL AND \"IsDeleted\" = false");

            builder.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            builder.Property(u => u.PasswordHash).HasMaxLength(255);
            builder.Property(u => u.PhoneNumber).HasMaxLength(50);
            builder.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("\"PhoneNumber\" IS NOT NULL AND \"IsDeleted\" = false");

            builder.Property(u => u.AvatarUrl).HasMaxLength(500).IsRequired().HasDefaultValue("");
            builder.Property(u => u.Role).IsRequired().HasDefaultValue(UserRole.User).HasConversion<int>();
            builder.Property(u => u.Status).IsRequired().HasDefaultValue(UserStatus.Unactivated).HasConversion<int>();

            builder.Property(u => u.GoogleId).HasMaxLength(255);
            builder.HasIndex(u => u.GoogleId)
                .IsUnique()
                .HasFilter("\"GoogleId\" IS NOT NULL AND \"IsDeleted\" = false");

            builder.Property(u => u.Locale).HasMaxLength(10);
            builder.Property(u => u.MarketingConsent).HasDefaultValue(false);
            builder.Property(u => u.FirstUtmSource).HasMaxLength(64);
            builder.Property(u => u.FirstUtmMedium).HasMaxLength(64);
            builder.Property(u => u.FirstUtmCampaign).HasMaxLength(128);

            builder.HasMany(u => u.Tokens)
                .WithOne()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(u => u.ExternalTokens)
                .WithOne()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(u => u.Addresses)
                .WithOne()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
