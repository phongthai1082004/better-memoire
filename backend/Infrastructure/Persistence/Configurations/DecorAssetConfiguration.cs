using Domain.Entities.DecorAssets;
using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class DecorAssetConfiguration : SoftDeleteEntityConfiguration<DecorAsset>
    {
        public override void Configure(EntityTypeBuilder<DecorAsset> builder)
        {
            base.Configure(builder);

            builder.ToTable("decor_assets");
            builder.Ignore(a => a.DomainEvents);

            builder.Property(a => a.Type).HasMaxLength(50).IsRequired();
            builder.Property(a => a.Category).HasMaxLength(100);
            builder.Property(a => a.Name).HasMaxLength(200).IsRequired();
            builder.Property(a => a.Url).HasMaxLength(1000).IsRequired();
            builder.Property(a => a.PublicId).HasMaxLength(500).IsRequired();

            builder.Property(a => a.CreatedBy).IsRequired();
            builder.HasIndex(a => new { a.Type, a.Category });

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
