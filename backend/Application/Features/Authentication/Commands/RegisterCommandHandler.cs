using Application.Common.Logging;
using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Features.Authentication.Services;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Configurations;
using Domain.Entities.Users;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;
using Microsoft.Extensions.Logging;
namespace Application.Features.Authentication.Commands
{
    public class RegisterCommandHandler(IUserRepository userRepository, IJwtService jwtService, IEmailService emailService, OtpAttemptCounter attemptCounter, OtpSettings otpSettings, ILogger<RegisterCommandHandler> logger) : ICommandHandler<RegisterCommand, RegisterResponse>
    {
        public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            var existing = await userRepository.GetUserByEmailWithTokensAsync(request.Email, cancellationToken);

            if (existing is not null && existing.Status == UserStatus.Active)
                throw new ConflictException(ErrorCode.AuthEmailExists);

            if (existing is not null && existing.Status == UserStatus.Banned)
                throw new ConflictException(ErrorCode.AuthAccountCannotRegister);

            User user;
            if (existing is null)
            {
                user = new User(request.Email, request.FullName, jwtService.HashPassword(request.Password), request.PhoneNumber);

                if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
                    user.UpdateProfile(request.FullName, request.PhoneNumber, request.AvatarUrl);

                userRepository.Insert(user);
            }
            else
            {
                user = existing;
                user.UpdateProfile(request.FullName, request.PhoneNumber, string.IsNullOrWhiteSpace(request.AvatarUrl) ? user.AvatarUrl : request.AvatarUrl);
                user.ChangePassword(jwtService.HashPassword(request.Password));
            }

            var code = Domain.Security.OtpCode.Generate();
            user.RevokeOtpTokens();
            await attemptCounter.ResetAsync(request.Email);
            user.AddToken(code, TokenType.Otp, DateTimeOffset.UtcNow.AddMinutes(otpSettings.ExpiryMinutes));

            await emailService.SendOtpAsync(request.Email, code, otpSettings.ExpiryMinutes, cancellationToken);

            logger.LogIfEnabled(LogLevel.Information, "Registration verification code issued for {Email}", request.Email);

            return new RegisterResponse(user.Email, user.FullName, user.PhoneNumber, user.AvatarUrl, user.Status, user.Role, OtpRequired: true);
        }
    }
}
