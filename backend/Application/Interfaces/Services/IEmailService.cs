namespace Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendOtpAsync(string email, string code, int expiryMinutes, CancellationToken cancellationToken = default);
    }
}
