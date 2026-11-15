using Domain.Entities.Ops;
using Domain.Entities.Users;
using Domain.Enums.Ops;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class MaintenanceWindowConfiguration : AuditableEntityConfiguration<MaintenanceWindow>
    {
        public override void Configure(EntityTypeBuilder<MaintenanceWindow> builder)
        {
            base.Configure(builder);

            builder.ToTable("maintenance_windows");
            builder.Ignore(w => w.DomainEvents);

            builder.Property(w => w.StartAt).IsRequired();
            builder.Property(w => w.EndAt);
            builder.Property(w => w.Reason).HasMaxLength(500);
            builder.Property(w => w.Status).IsRequired().HasConversion<int>();

            builder.HasIndex(w => new { w.Status, w.StartAt });
            builder.HasIndex(w => w.StartAt);
            builder.HasIndex(w => w.EndAt);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(w => w.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(w => w.EndedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
