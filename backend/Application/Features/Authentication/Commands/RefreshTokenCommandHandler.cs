using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Authentication.Commands
{
    public class RefreshTokenCommandHandler(
        IJwtService jwtService,
        IUserRepository userRepository,
        IAuthTokenIssuer tokenIssuer) : ICommandHandler<RefreshTokenCommand, AuthResponse>
    {
        public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            var userId = jwtService.ValidateRefreshToken(request.RefreshToken)
                         ?? throw new UnauthorizedException(ErrorCode.AuthRefreshInvalid);

            var user = await userRepository.GetUserByIdWithTokensAsync(userId, cancellationToken)
                       ?? throw new UnauthorizedException(ErrorCode.AuthRefreshRevoked);

            if (user.Status == UserStatus.Banned)
            {
                user.RevokeAllTokens();
                throw new ForbiddenException(ErrorCode.AuthAccountSuspended);
            }

            var token = user.FindRefreshToken(request.RefreshToken);
            if (token is null || !token.IsValid(DateTimeOffset.UtcNow))
            {
                // A missing or already-rotated token is a strong replay signal.
                user.RevokeAllTokens();
                throw new UnauthorizedException(ErrorCode.AuthRefreshRevoked);
            }

            token.Revoke();
            return tokenIssuer.Issue(user);
        }
    }
}
