using Application.CQRS;
using Application.Features.Media.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Media.Queries
{
    public record GetUserImagesQuery(int Limit) : IQuery<IReadOnlyList<UserImageResponse>>;

    public class GetUserImagesQueryHandler(
        IUserImageRepository imageRepository,
        ICurrentUserService currentUser)
        : IQueryHandler<GetUserImagesQuery, IReadOnlyList<UserImageResponse>>
    {
        public async Task<IReadOnlyList<UserImageResponse>> Handle(
            GetUserImagesQuery request,
            CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var limit = Math.Clamp(request.Limit, 1, 100);
            var images = await imageRepository.GetForUserAsync(userId, limit, cancellationToken);
            return images.Select(UserImageResponse.From).ToList();
        }
    }
}
