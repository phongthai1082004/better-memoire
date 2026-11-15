using Domain.Abstractions.Entities;

namespace Domain.Entities.DecorAssets
{
    /// <summary>
    /// Sticker/frame/decor asset. Soft-deleted because existing book page content may
    /// still reference the asset URL.
    /// </summary>
    public class DecorAsset : SoftDeleteAggregateRoot
    {
        public string Type { get; private set; } = string.Empty;
        public string? Category { get; private set; }
        public string Name { get; private set; } = string.Empty;
        public string Url { get; private set; } = string.Empty;
        public string PublicId { get; private set; } = string.Empty;

        private DecorAsset()
        {
        }

        public DecorAsset(string type, string name, string url, string publicId, string? category = null)
        {
            Type = type;
            Name = name;
            Url = url;
            PublicId = publicId;
            Category = category;
        }

        public void Update(string name, string url, string publicId, string? category)
        {
            Name = name;
            Url = url;
            PublicId = publicId;
            Category = category;
        }
    }
}
