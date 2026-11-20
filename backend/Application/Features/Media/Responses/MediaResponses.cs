using Domain.Entities.Media;

namespace Application.Features.Media.Responses
{
    public record UserImageResponse(Guid Id, string Url, string PublicId, string? ThumbUrl, int? Width, int? Height, int? Size, string? MimeType, string? OriginalName, DateTimeOffset CreatedOnUtc)
    {
        public static UserImageResponse From(UserImage image) => new(image.Id, image.Url, image.PublicId, image.ThumbUrl, image.Width, image.Height, image.Size, image.MimeType, image.OriginalName, image.CreatedOnUtc);
    }

    public record UploadTicketResponse(string UploadUrl, string Token, string Folder, long Expiry);
}
