using Domain.Entities.Media;
using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class UserImageConfiguration : SoftDeleteEntityConfiguration<UserImage>
    {
        public override void Configure(EntityTypeBuilder<UserImage> builder)
        {
            base.Configure(builder);

            builder.ToTable("user_images");
            builder.Ignore(i => i.DomainEvents);

            builder.Property(i => i.Url).HasMaxLength(1000).IsRequired();
            builder.Property(i => i.PublicId).HasMaxLength(500).IsRequired();
            builder.Property(i => i.ThumbUrl).HasMaxLength(1000);
            builder.Property(i => i.MimeType).HasMaxLength(100);
            builder.Property(i => i.OriginalName).HasMaxLength(255);
            builder.Property(i => i.ContentHash).HasMaxLength(64);

            builder.HasIndex(i => i.UserId);
            builder.HasIndex(i => i.ContentHash);
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
