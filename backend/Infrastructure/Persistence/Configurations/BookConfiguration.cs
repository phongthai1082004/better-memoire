using Domain.Entities.Books;
using Domain.Entities.SampleBooks;
using Domain.Entities.Users;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class BookConfiguration : SoftDeleteEntityConfiguration<Book>
    {
        public override void Configure(EntityTypeBuilder<Book> builder)
        {
            base.Configure(builder);

            builder.ToTable("books");
            builder.Ignore(b => b.DomainEvents);

            builder.Property(b => b.Type).HasMaxLength(50).IsRequired();
            builder.Property(b => b.Title).HasMaxLength(200).IsRequired();
            builder.Property(b => b.Style).HasMaxLength(50).IsRequired();
            builder.Property(b => b.Font).HasMaxLength(100).IsRequired();
            builder.Property(b => b.Cover).HasMaxLength(50).IsRequired();
            builder.Property(b => b.CoverUrl).HasMaxLength(1000);
            builder.Property(b => b.PaperHeight).HasColumnType("double precision");
            builder.Property(b => b.PaperWidth).HasColumnType("double precision");
            builder.Property(b => b.PageCount).HasDefaultValue(0);

            builder.HasIndex(b => b.UserId);
            builder.HasIndex(b => new { b.UserId, b.SampleBookId })
                .IsUnique()
                .HasFilter("\"SampleBookId\" IS NOT NULL AND \"IsDeleted\" = false");

            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<SampleBook>()
                .WithMany()
                .HasForeignKey(b => b.SampleBookId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(b => b.Pages)
                .WithOne()
                .HasForeignKey(p => p.BookId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
