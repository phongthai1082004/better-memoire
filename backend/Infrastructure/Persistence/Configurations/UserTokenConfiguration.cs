using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class UserTokenConfiguration : AuditableEntityConfiguration<UserToken>
    {
        public override void Configure(EntityTypeBuilder<UserToken> builder)
        {
            base.Configure(builder);

            builder.ToTable("user_tokens");

            builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
            builder.HasIndex(t => t.TokenHash).IsUnique();

            builder.Property(t => t.Type).IsRequired().HasConversion<int>();
            builder.Property(t => t.UserAgent).HasMaxLength(500);
            builder.Property(t => t.Ip).HasMaxLength(64);
            builder.Property(t => t.DeviceId).HasMaxLength(128);
            builder.Property(t => t.ExpiresAt).IsRequired();

            builder.HasIndex(t => new { t.UserId, t.ExpiresAt });
        }
    }
}
