using Domain.Entities.SampleBooks;
using Domain.Entities.Users;
using Domain.Enums.Products;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class SampleBookConfiguration : SoftDeleteEntityConfiguration<SampleBook>
    {
        public override void Configure(EntityTypeBuilder<SampleBook> builder)
        {
            base.Configure(builder);

            builder.ToTable("sample_books");
            builder.Ignore(s => s.DomainEvents);

            builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
            builder.Property(s => s.Slug).HasMaxLength(200);
            builder.Property(s => s.Description).HasMaxLength(2000);
            builder.Property(s => s.Type).IsRequired().HasConversion<int>();
            builder.Property(s => s.Category).HasMaxLength(100);
            builder.Property(s => s.Tags).HasColumnType("text[]").IsRequired();
            builder.Property(s => s.Style).HasMaxLength(50).IsRequired();
            builder.Property(s => s.Font).HasMaxLength(100).IsRequired();
            builder.Property(s => s.Cover).HasMaxLength(50).IsRequired();
            builder.Property(s => s.CoverUrl).HasMaxLength(1000);
            builder.Property(s => s.PaperHeight).HasColumnType("double precision");
            builder.Property(s => s.PaperWidth).HasColumnType("double precision");
            builder.Property(s => s.Status).IsRequired().HasConversion<int>();
            builder.Property(s => s.Content).HasColumnType("jsonb");

            builder.Property(s => s.CreatedBy).IsRequired();
            builder.HasIndex(s => s.Slug)
                .IsUnique()
                .HasFilter("\"Slug\" IS NOT NULL AND \"IsDeleted\" = false");
            builder.HasIndex(s => new { s.Type, s.Status, s.SortOrder });
            builder.HasIndex(s => s.Category);

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
