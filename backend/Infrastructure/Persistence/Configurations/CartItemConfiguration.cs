using Domain.Entities.Books;
using Domain.Entities.Carts;
using Domain.Entities.PrintOptions;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class CartItemConfiguration : AuditableEntityConfiguration<CartItem>
    {
        public override void Configure(EntityTypeBuilder<CartItem> builder)
        {
            base.Configure(builder);

            builder.ToTable("cart_items");

            builder.Property(i => i.Quantity).IsRequired();

            builder.HasIndex(i => new { i.CartId, i.BookId }).IsUnique();

            builder.HasOne<Book>()
                .WithMany()
                .HasForeignKey(i => i.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne<PrintOption>()
                .WithMany()
                .HasForeignKey(i => i.CoverOptionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<PrintOption>()
                .WithMany()
                .HasForeignKey(i => i.PaperOptionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<PrintOption>()
                .WithMany()
                .HasForeignKey(i => i.SizeOptionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
