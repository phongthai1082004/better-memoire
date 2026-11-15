using Domain.Entities.PrintOptions;
using Domain.Entities.Suppliers;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class SupplierPrintOptionConfiguration : SoftDeleteEntityConfiguration<SupplierPrintOption>
    {
        public override void Configure(EntityTypeBuilder<SupplierPrintOption> builder)
        {
            base.Configure(builder);

            builder.ToTable("supplier_print_options");

            builder.Property(o => o.CostPrice).IsRequired();
            builder.Property(o => o.CostPerPage).IsRequired();

            builder.HasIndex(o => new { o.SupplierId, o.PrintOptionId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            builder.HasOne<PrintOption>()
                .WithMany()
                .HasForeignKey(o => o.PrintOptionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
