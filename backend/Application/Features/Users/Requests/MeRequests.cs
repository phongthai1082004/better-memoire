namespace Application.Features.Users.Requests
{
    public record UpdateMeRequest(
        string FullName,
        string? PhoneNumber,
        string? AvatarUrl,
        string? Locale,
        bool MarketingConsent);

    public record ChangeMyPasswordRequest(string? CurrentPassword, string NewPassword);

    public record AddressRequest(
        string RecipientName,
        string Phone,
        string Province,
        string District,
        string Ward,
        string Street,
        bool IsDefault);
}
