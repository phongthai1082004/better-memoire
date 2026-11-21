using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Resources;
using Microsoft.Extensions.Localization;

namespace Application.Features.Users.Commands
{
    public record ChangeMyPasswordCommand(string? CurrentPassword, string NewPassword)
            : ICommand<MessageResponse>;

    public class ChangeMyPasswordCommandHandler(IUserRepository userRepository, ICurrentUserService currentUser, IJwtService jwtService, IStringLocalizer<Message> localizer) : ICommandHandler<ChangeMyPasswordCommand, MessageResponse>
    {
        public async Task<MessageResponse> Handle(ChangeMyPasswordCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var user = await userRepository.GetUserByIdWithTokensAsync(userId, cancellationToken)
                       ?? throw new NotFoundException(ErrorCode.NotFound);

            if (user.HasPassword)
            {
                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                    throw new BadRequestException(ErrorCode.AuthCurrentPasswordRequired);

                if (!jwtService.VerifyPassword(request.CurrentPassword, user.PasswordHash!))
                    throw new BadRequestException(ErrorCode.AuthCurrentPasswordWrong);
            }

            if (request.NewPassword.Length < 8)
                throw new BadRequestException(ErrorCode.AuthNewPasswordInvalid);

            user.ChangePassword(jwtService.HashPassword(request.NewPassword));
            return new MessageResponse(localizer["Auth.PasswordChanged"]);
        }
    }
}
