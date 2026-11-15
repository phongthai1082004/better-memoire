using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Resources;
using Microsoft.Extensions.Localization;

namespace Application.Features.Authentication.Commands
{
    public class LogoutCommandHandler(
        ICurrentUserService currentUserService,
        IUserRepository userRepository,
        IStringLocalizer<Message> localizer) : ICommandHandler<LogoutCommand, MessageResponse>
    {
        public async Task<MessageResponse> Handle(LogoutCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUserService.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var user = await userRepository.GetUserByIdWithTokensAsync(userId, cancellationToken)
                       ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            user.RevokeAllTokens();
            return new MessageResponse(localizer["Auth.SignedOut"]);
        }
    }
}
