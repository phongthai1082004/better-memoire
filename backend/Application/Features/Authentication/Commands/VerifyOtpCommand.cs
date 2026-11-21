using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Features.Authentication.Services;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Configurations;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Authentication.Commands
{
    public record VerifyOtpCommand(string Email, string Otp, string? Password, string? FullName, string? PhoneNumber) : ICommand<AuthResponse>;

    public class VerifyOtpCommandHandler(IUserRepository userRepository, IJwtService jwtService, IAuthTokenIssuer tokenIssuer, OtpAttemptCounter attemptCounter, OtpSettings otpSettings) : ICommandHandler<VerifyOtpCommand, AuthResponse>
    {
        public async Task<AuthResponse> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
        {
            var user = await userRepository.GetUserByEmailWithTokensAsync(request.Email, cancellationToken);

            if (user is null)
                throw new BadRequestException(ErrorCode.AuthInvalidOtp);

            if (user.Status == UserStatus.Banned)
                throw new ForbiddenException(ErrorCode.AuthAccountSuspended);

            if (user.Status == UserStatus.Active)
                throw new BadRequestException(ErrorCode.AuthAlreadyVerified);

            var attemptsBefore = await attemptCounter.GetAsync(request.Email);
            if (attemptsBefore >= otpSettings.MaxAttempts)
                throw new TooManyRequestsException(ErrorCode.AuthOtpTooManyAttempts);

            var now = DateTimeOffset.UtcNow;
            if (!user.ConsumeOtp(request.Otp, now))
            {
                await attemptCounter.IncrementAsync(request.Email, cancellationToken);
                throw new BadRequestException(ErrorCode.AuthInvalidOtp);
            }

            await attemptCounter.ResetAsync(request.Email);
            user.RevokeOtpTokens();

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.UpdateProfile(request.FullName, request.PhoneNumber ?? user.PhoneNumber, user.AvatarUrl);
            else if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                user.ChangePhoneNumber(request.PhoneNumber);

            if (!string.IsNullOrWhiteSpace(request.Password))
                user.ChangePassword(jwtService.HashPassword(request.Password));
            else if (!user.HasPassword)
                throw new BadRequestException(ErrorCode.AuthPasswordRequired);

            user.Activate();
            user.VerifyEmail(now);
            user.RecordLogin(now);

            return tokenIssuer.Issue(user);
        }
    }
}
