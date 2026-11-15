namespace Application.Interfaces.Services
{
    public record GoogleUserInfo(
        string Subject,
        string Email,
        bool EmailVerified,
        string? Name,
        string? Picture);

    public interface IGoogleTokenValidator
    {
        Task<GoogleUserInfo> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
    }
}
