using Domain.Abstractions.Entities;
using Domain.Enums.Products;

namespace Domain.Entities.SampleBooks
{
    /// <summary>
    /// Admin-managed template catalog entry. Soft-deleted so books and orders keep
    /// their <c>SampleBookId</c> reference. <see cref="Quantity"/> null means unlimited.
    /// </summary>
    public class SampleBook : SoftDeleteAggregateRoot
    {
        public string Name { get; private set; } = string.Empty;
        public string? Slug { get; private set; }
        public string? Description { get; private set; }
        public string? Category { get; private set; }
        public string[] Tags { get; private set; } = [];
        public int? Quantity { get; private set; }
        public string Style { get; private set; } = string.Empty;
        public string Font { get; private set; } = string.Empty;
        public string Cover { get; private set; } = string.Empty;
        public string? CoverUrl { get; private set; }
        public double? PaperHeight { get; private set; }
        public double? PaperWidth { get; private set; }
        public SampleBookStatus Status { get; private set; } = SampleBookStatus.Draft;
        public int SortOrder { get; private set; }
        public DateTimeOffset? PublishedAt { get; private set; }
        public string? Content { get; private set; }

        private SampleBook()
        {
        }

        public SampleBook(
            string name,
            string style,
            string font,
            string cover,
            string? slug = null,
            string? description = null,
            string? category = null,
            string[]? tags = null,
            int? quantity = null,
            string? coverUrl = null,
            double? paperHeight = null,
            double? paperWidth = null,
            string? content = null)
        {
            Name = name;
            Style = style;
            Font = font;
            Cover = cover;
            Slug = slug;
            Description = description;
            Category = category;
            Tags = tags ?? [];
            Quantity = quantity;
            CoverUrl = coverUrl;
            PaperHeight = paperHeight;
            PaperWidth = paperWidth;
            Content = content;
        }

        public void UpdateContent(string? content) => Content = content;

        public void Publish(DateTimeOffset at)
        {
            Status = SampleBookStatus.Published;
            PublishedAt = at;
        }

        public void Archive() => Status = SampleBookStatus.Archived;

        public void MoveToDraft()
        {
            Status = SampleBookStatus.Draft;
            PublishedAt = null;
        }

        public bool IsInStock(int need) => Quantity is null || Quantity >= need;

        /// <summary>Conditionally deducts stock. Unlimited stock always succeeds.</summary>
        public bool TryDeductStock(int need)
        {
            if (need < 0)
                throw new ArgumentOutOfRangeException(nameof(need));

            if (Quantity is null)
                return true;

            if (Quantity < need)
                return false;

            Quantity -= need;
            return true;
        }

        /// <summary>Returns stock only for limited-quantity templates.</summary>
        public void Restock(int quantity)
        {
            if (quantity < 0)
                throw new ArgumentOutOfRangeException(nameof(quantity));

            if (Quantity is not null)
                Quantity += quantity;
        }
    }
}
