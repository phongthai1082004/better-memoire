using Application.CQRS;
using Application.Features.Users.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Users.Commands
{
    public class UpdateMeCommandHandler(IUserRepository userRepository, ICurrentUserService currentUser) : ICommandHandler<UpdateMeCommand, UserProfileResponse>
    {
        public async Task<UserProfileResponse> Handle(UpdateMeCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var user = await userRepository.GetByIdAsync([userId], cancellationToken)
                       ?? throw new NotFoundException(ErrorCode.NotFound);

            user.UpdateProfile(request.FullName, request.PhoneNumber, request.AvatarUrl ?? user.AvatarUrl);
            user.UpdatePreferences(request.Locale, request.MarketingConsent);

            return UserProfileResponse.From(user);
        }
    }
}
