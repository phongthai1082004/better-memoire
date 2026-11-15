using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Users;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Authentication.Commands
{
    public class GoogleLoginCommandHandler(
        IGoogleTokenValidator googleTokenValidator,
        IUserRepository userRepository,
        IAuthTokenIssuer tokenIssuer) : ICommandHandler<GoogleLoginCommand, AuthResponse>
    {
        public async Task<AuthResponse> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
        {
            var google = await googleTokenValidator.ValidateAsync(request.IdToken, cancellationToken);
            var now = DateTimeOffset.UtcNow;

            var user = await userRepository.GetUserByGoogleIdAsync(google.Subject, cancellationToken)
                       ?? await userRepository.GetUserByEmailWithTokensAsync(google.Email, cancellationToken);

            if (user is null)
            {
                var localPart = google.Email.Split('@')[0];
                user = new User(
                    google.Email,
                    string.IsNullOrWhiteSpace(google.Name)
                        ? (string.IsNullOrWhiteSpace(localPart) ? "User" : localPart)
                        : google.Name,
                    null,
                    null);

                user.LinkGoogleAccount(google.Subject, google.Picture, now);
                user.Activate();
                user.VerifyEmail(now);
                userRepository.Insert(user);
            }
            else
            {
                if (user.Status == UserStatus.Banned)
                    throw new ForbiddenException(ErrorCode.AuthAccountSuspended);

                if (!string.IsNullOrWhiteSpace(user.GoogleId) &&
                    !string.Equals(user.GoogleId, google.Subject, StringComparison.Ordinal))
                {
                    throw new UnauthorizedException(ErrorCode.AuthGoogleLinkedOther);
                }

                if (string.IsNullOrWhiteSpace(user.GoogleId))
                    user.LinkGoogleAccount(google.Subject, google.Picture, now);

                if (user.Status == UserStatus.Unactivated)
                {
                    user.Activate();
                    user.VerifyEmail(now);
                }
            }

            user.RecordLogin(now);
            return tokenIssuer.Issue(user);
        }
    }
}
