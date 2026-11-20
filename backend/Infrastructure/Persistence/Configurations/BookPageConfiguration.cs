using Domain.Entities.Books;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class BookPageConfiguration : AuditableEntityConfiguration<BookPage>
    {
        public override void Configure(EntityTypeBuilder<BookPage> builder)
        {
            base.Configure(builder);

            builder.ToTable("book_pages");

            builder.Property(p => p.Id).HasMaxLength(64).ValueGeneratedNever();
            builder.Property(p => p.Content).HasColumnType("jsonb").IsRequired();
            builder.Property(p => p.Version).IsConcurrencyToken().HasDefaultValue(1);
            builder.Property(p => p.SchemaVersion).HasDefaultValue(1);
            builder.Property(p => p.UpdatedAt).IsRequired();

            builder.HasIndex(p => new { p.BookId, p.Position });
        }
    }
}
