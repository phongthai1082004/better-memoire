using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class AuditLogConfiguration : AuditableEntityConfiguration<AuditLog>
    {
        public override void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            base.Configure(builder);

            builder.ToTable("audit_logs");

            builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
            builder.Property(a => a.Entity).HasMaxLength(100).IsRequired();
            builder.Property(a => a.EntityId).HasMaxLength(100).IsRequired();
            builder.Property(a => a.Before).HasColumnType("jsonb");
            builder.Property(a => a.After).HasColumnType("jsonb");
            builder.Property(a => a.Ip).HasMaxLength(64);

            builder.HasIndex(a => a.CreatedOnUtc);
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.ActorId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
