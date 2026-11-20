namespace Application.Features.Authentication.Requests
{
    public record VerifyOtpRequest(string Email, string Otp, string? Password, string? FullName, string? PhoneNumber);
}
