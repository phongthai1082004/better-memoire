using Application.CQRS;
using Application.Features.Users.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Users.Queries
{
    public record GetMeQuery : IQuery<UserProfileResponse>;

    public class GetMeQueryHandler(
        IUserRepository userRepository,
        ICurrentUserService currentUser) : IQueryHandler<GetMeQuery, UserProfileResponse>
    {
        public async Task<UserProfileResponse> Handle(GetMeQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var user = await userRepository.GetByIdAsync([userId], cancellationToken)
                       ?? throw new NotFoundException(ErrorCode.NotFound);

            return UserProfileResponse.From(user);
        }
    }
}
