using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Authentication.Commands
{
    public class LoginCommandHandler(
        IJwtService jwtService,
        IUserRepository userRepository,
        IAuthTokenIssuer tokenIssuer) : ICommandHandler<LoginCommand, AuthResponse>
    {
        public async Task<AuthResponse> Handle(LoginCommand request, CancellationToken cancellationToken = default)
        {
            var user = await userRepository.GetUserByEmailWithTokensAsync(request.Email, cancellationToken);

            if (user is null || !user.HasPassword || !jwtService.VerifyPassword(request.Password, user.PasswordHash!))
                throw new UnauthorizedException(ErrorCode.AuthInvalidCredentials);

            if (user.Status == UserStatus.Banned)
                throw new ForbiddenException(ErrorCode.AuthAccountSuspended);

            if (user.Status != UserStatus.Active)
                throw new ForbiddenException(ErrorCode.AuthEmailNotVerified);

            user.RecordLogin(DateTimeOffset.UtcNow);
            return tokenIssuer.Issue(user);
        }
    }
}
