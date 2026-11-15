using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class AddressConfiguration : SoftDeleteEntityConfiguration<Address>
    {
        public override void Configure(EntityTypeBuilder<Address> builder)
        {
            base.Configure(builder);

            builder.ToTable("addresses");

            builder.Property(a => a.RecipientName).HasMaxLength(150).IsRequired();
            builder.Property(a => a.Phone).HasMaxLength(30).IsRequired();
            builder.Property(a => a.Province).HasMaxLength(150).IsRequired();
            builder.Property(a => a.District).HasMaxLength(150).IsRequired();
            builder.Property(a => a.Ward).HasMaxLength(150).IsRequired();
            builder.Property(a => a.Street).HasMaxLength(300).IsRequired();

            builder.HasIndex(a => new { a.UserId, a.IsDefault });
        }
    }
}
