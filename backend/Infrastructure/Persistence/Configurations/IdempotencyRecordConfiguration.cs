using Domain.Entities.Idempotency;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class IdempotencyRecordConfiguration : AuditableEntityConfiguration<IdempotencyRecord>
    {
        public override void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
        {
            base.Configure(builder);

            builder.ToTable("idempotency_records");

            builder.Property(r => r.Key).HasMaxLength(255).IsRequired();
            builder.HasIndex(r => r.Key).IsUnique();

            builder.Property(r => r.Endpoint).HasMaxLength(500).IsRequired();
            builder.Property(r => r.RequestHash).HasMaxLength(64);
            builder.Property(r => r.Status).IsRequired().HasConversion<int>();
            builder.Property(r => r.ResponseBody);
            builder.Property(r => r.ResponseContentType).HasMaxLength(100);
            builder.Property(r => r.ExpiresAt).IsRequired();

            builder.HasIndex(r => new { r.UserId, r.Endpoint });
            builder.HasIndex(r => r.ExpiresAt);
        }
    }
}
