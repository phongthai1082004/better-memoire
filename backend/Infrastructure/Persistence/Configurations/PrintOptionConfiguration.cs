using Domain.Entities.PrintOptions;
using Domain.Enums.Products;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class PrintOptionConfiguration : SoftDeleteEntityConfiguration<PrintOption>
    {
        public override void Configure(EntityTypeBuilder<PrintOption> builder)
        {
            base.Configure(builder);

            builder.ToTable("print_options");
            builder.Ignore(o => o.DomainEvents);

            builder.Property(o => o.Type).IsRequired().HasConversion<int>();
            builder.Property(o => o.Code).HasMaxLength(50).IsRequired();
            builder.Property(o => o.Name).HasColumnType("jsonb").IsRequired();
            builder.Property(o => o.Description).HasColumnType("jsonb").IsRequired();

            builder.HasIndex(o => new { o.Type, o.Code })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            builder.HasIndex(o => o.Type);
        }
    }
}
