using Domain.Entities.Books;
using Domain.Entities.Orders;
using Domain.Entities.PrintOptions;
using Domain.Enums.Orders;
using Domain.Enums.Products;
using Infrastructure.Persistence.Configurations.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class OrderItemConfiguration : AuditableEntityConfiguration<OrderItem>
    {
        public override void Configure(EntityTypeBuilder<OrderItem> builder)
        {
            base.Configure(builder);

            builder.ToTable("order_items");

            builder.Property(i => i.BookTitle).HasMaxLength(300).IsRequired();
            builder.Property(i => i.ContentSnapshot).HasColumnType("jsonb").IsRequired();
            builder.Property(i => i.ImageIds).HasColumnType("uuid[]").IsRequired();

            builder.Property(i => i.PdfStatus).IsRequired().HasConversion<int>();
            builder.Property(i => i.PdfUrl).HasMaxLength(1000);
            builder.Property(i => i.PdfLastError).HasMaxLength(2000);

            builder.Property(i => i.ReturnState).IsRequired().HasConversion<int>();
            builder.Property(i => i.ReturnFault).HasConversion<int>();
            builder.Property(i => i.ReturnReason).HasMaxLength(1000);
            builder.Property(i => i.DefectState).IsRequired().HasConversion<int>();
            builder.Property(i => i.DefectNote).HasMaxLength(1000);
            builder.Property(i => i.EvidenceUrls).HasColumnType("text[]").IsRequired();

            builder.HasIndex(i => i.OrderId);
            builder.HasIndex(i => i.PdfStatus);
            builder.HasIndex(i => i.ImageIds).HasMethod("gin");

            builder.HasOne<Book>()
                .WithMany()
                .HasForeignKey(i => i.BookId)
                .OnDelete(DeleteBehavior.SetNull);

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

            builder.HasOne<OrderItem>()
                .WithMany()
                .HasForeignKey(i => i.ReprintOfItemId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
