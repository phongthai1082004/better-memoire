using Application.CQRS;
using Application.Features.Media.Responses;

namespace Application.Features.Media.Commands
{
    public record SaveUserImageCommand(string Url, string PublicId, string? ThumbUrl, int? Width, int? Height, int? Size, string? MimeType, string? OriginalName, string? ContentHash) : ICommand<UserImageResponse>;
}
