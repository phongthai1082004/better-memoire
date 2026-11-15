using Domain.Entities.Notifications;
using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class NotificationConfiguration : SoftDeleteEntityConfiguration<Notification>
    {
        public override void Configure(EntityTypeBuilder<Notification> builder)
        {
            base.Configure(builder);

            builder.ToTable("notifications");
            builder.Ignore(n => n.DomainEvents);

            builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
            builder.Property(n => n.Message).HasMaxLength(2000).IsRequired();
            builder.Property(n => n.SendBy).HasMaxLength(100).IsRequired().HasDefaultValue("system");
            builder.Property(n => n.Type).IsRequired().HasConversion<int>();
            builder.Property(n => n.Channels).HasColumnType("text[]").IsRequired();
            builder.Property(n => n.Scope).HasMaxLength(20).IsRequired().HasDefaultValue("personal");
            builder.Property(n => n.Email).HasMaxLength(256);
            builder.Property(n => n.Phone).HasMaxLength(50);
            builder.Property(n => n.Link).HasMaxLength(500);
            builder.Property(n => n.Metadata).HasColumnType("jsonb");
            builder.Property(n => n.I18n).HasColumnType("jsonb");

            builder.HasIndex(n => new { n.UserId, n.IsRead });
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
