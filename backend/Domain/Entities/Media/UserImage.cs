using Domain.Abstractions.Entities;

namespace Domain.Entities.Media
{
    /// <summary>
    /// Uploaded image (R2 object) owned by a user. Soft-deleted because book pages and
    /// frozen order snapshots may still reference it; the R2 object is purged separately.
    /// </summary>
    public class UserImage : SoftDeleteAggregateRoot
    {
        public Guid UserId { get; private set; }
        public string Url { get; private set; } = string.Empty;
        public string PublicId { get; private set; } = string.Empty;
        public string? ThumbUrl { get; private set; }
        public int? Width { get; private set; }
        public int? Height { get; private set; }
        public int? Size { get; private set; }
        public string? MimeType { get; private set; }
        public string? OriginalName { get; private set; }
        public string? ContentHash { get; private set; }

        private UserImage()
        {
        }

        public UserImage(
            Guid userId,
            string url,
            string publicId,
            string? thumbUrl = null,
            int? width = null,
            int? height = null,
            int? size = null,
            string? mimeType = null,
            string? originalName = null,
            string? contentHash = null)
        {
            UserId = userId;
            Url = url;
            PublicId = publicId;
            ThumbUrl = thumbUrl;
            Width = width;
            Height = height;
            Size = size;
            MimeType = mimeType;
            OriginalName = originalName;
            ContentHash = contentHash;
        }

        public void UpdateThumbnail(string? thumbUrl) => ThumbUrl = thumbUrl;
    }
}
