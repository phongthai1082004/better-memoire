using Domain.Entities.Books;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class BookPageEventConfiguration : IEntityTypeConfiguration<BookPageEvent>
    {
        public void Configure(EntityTypeBuilder<BookPageEvent> builder)
        {
            builder.ToTable("book_page_events");
            builder.HasKey(e => e.Id);

            builder.Property(e => e.PageId).HasMaxLength(64).IsRequired();
            builder.Property(e => e.Type).HasMaxLength(64).IsRequired();
            builder.Property(e => e.Patch).HasColumnType("jsonb");
            builder.Property(e => e.CreatedOnUtc).IsRequired();

            builder.HasIndex(e => new { e.BookId, e.Seq }).IsUnique();
            builder.HasIndex(e => new { e.PageId, e.ClientMutationId })
                .IsUnique()
                .HasFilter("\"ClientMutationId\" IS NOT NULL");
            builder.HasIndex(e => new { e.BookId, e.CreatedOnUtc });

            builder.HasOne<Book>()
                .WithMany()
                .HasForeignKey(e => e.BookId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
