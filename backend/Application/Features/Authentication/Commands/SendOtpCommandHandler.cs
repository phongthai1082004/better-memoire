using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Features.Authentication.Services;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Configurations;
using Domain.Entities.Users;
using Domain.Enums.Users;
using Domain.Resources;
using Domain.Security;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;

namespace Application.Features.Authentication.Commands
{
    public class SendOtpCommandHandler(
        IUserRepository userRepository,
        IEmailService emailService,
        OtpAttemptCounter attemptCounter,
        OtpSettings otpSettings,
        IStringLocalizer<Message> localizer,
        ILogger<SendOtpCommandHandler> logger) : ICommandHandler<SendOtpCommand, MessageResponse>
    {
        public async Task<MessageResponse> Handle(SendOtpCommand request, CancellationToken cancellationToken)
        {
            var user = await userRepository.GetUserByEmailWithTokensAsync(request.Email, cancellationToken);

            // Never reveal whether an account already exists.
            if (user is not null && user.Status != UserStatus.Unactivated)
                return new MessageResponse(localizer["Auth.OtpSent"]);

            if (user is null)
            {
                var localPart = request.Email.Split('@')[0];
                user = new User(request.Email, string.IsNullOrWhiteSpace(localPart) ? "User" : localPart, null, null);
                userRepository.Insert(user);
            }

            var code = OtpCode.Generate();
            user.RevokeOtpTokens();
            await attemptCounter.ResetAsync(request.Email);
            user.AddToken(code, TokenType.Otp, DateTimeOffset.UtcNow.AddMinutes(otpSettings.ExpiryMinutes));

            await emailService.SendOtpAsync(
                request.Email,
                code,
                otpSettings.ExpiryMinutes,
                cancellationToken);

            logger.LogInformation("Verification code reissued for {Email}", request.Email);

            return new MessageResponse(localizer["Auth.OtpSent"]);
        }
    }
}
