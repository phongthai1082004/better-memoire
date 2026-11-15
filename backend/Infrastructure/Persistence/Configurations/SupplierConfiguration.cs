using Domain.Entities.Suppliers;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class SupplierConfiguration : SoftDeleteEntityConfiguration<Supplier>
    {
        public override void Configure(EntityTypeBuilder<Supplier> builder)
        {
            base.Configure(builder);

            builder.ToTable("suppliers");
            builder.Ignore(s => s.DomainEvents);

            builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
            builder.Property(s => s.Contact).HasMaxLength(150).IsRequired();
            builder.Property(s => s.Email).HasMaxLength(256).IsRequired();
            builder.HasIndex(s => s.Email)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            builder.Property(s => s.TaxCode).HasMaxLength(50);
            builder.Property(s => s.Address).HasMaxLength(500);
            builder.Property(s => s.BankName).HasMaxLength(200);
            builder.Property(s => s.BankBin).HasMaxLength(20);
            builder.Property(s => s.BankAccountNumber).HasMaxLength(50);
            builder.Property(s => s.BankAccountName).HasMaxLength(200);
            builder.Property(s => s.ContactPerson).HasMaxLength(150);
            builder.Property(s => s.BannedReason).HasMaxLength(500);

            builder.HasIndex(s => s.Banned);

            builder.HasMany(s => s.PrintOptions)
                .WithOne()
                .HasForeignKey(o => o.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
