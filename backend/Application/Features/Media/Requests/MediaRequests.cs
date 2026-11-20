namespace Application.Features.Media.Requests
{
    public record SaveUserImageRequest(string Url, string PublicId, string? ThumbUrl, int? Width, int? Height, int? Size, string? MimeType, string? OriginalName, string? ContentHash);
}
