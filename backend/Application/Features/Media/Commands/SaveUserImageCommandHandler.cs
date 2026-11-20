using Application.CQRS;
using Application.Features.Media.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Media;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Media.Commands
{
    public class SaveUserImageCommandHandler(IUserImageRepository imageRepository, IStorageService storage, ICurrentUserService currentUser) : ICommandHandler<SaveUserImageCommand, UserImageResponse>
    {
        public Task<UserImageResponse> Handle(SaveUserImageCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            if (string.IsNullOrWhiteSpace(request.Url))
                throw new BadRequestException(ErrorCode.MediaUrlRequired);

            if (!storage.IsOwnedUrl(request.Url))
                throw new BadRequestException(ErrorCode.MediaInvalidUrl);

            if (string.IsNullOrWhiteSpace(request.PublicId) || !request.PublicId.StartsWith("echotrace/", StringComparison.Ordinal))
            {
                throw new BadRequestException(ErrorCode.MediaInvalidUrl);
            }

            var image = new UserImage(userId, request.Url, request.PublicId, request.ThumbUrl, request.Width, request.Height, request.Size, request.MimeType, request.OriginalName, request.ContentHash)
            {
                CreatedOnUtc = DateTimeOffset.UtcNow
            };

            imageRepository.Insert(image);
            return Task.FromResult(UserImageResponse.From(image));
        }
    }
}
