using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Authentication.Commands
{
    public record VerifyOtpCommand(
        string Email,
        string Otp,
        string? Password,
        string? FullName,
        string? PhoneNumber) : ICommand<AuthResponse>;
}
