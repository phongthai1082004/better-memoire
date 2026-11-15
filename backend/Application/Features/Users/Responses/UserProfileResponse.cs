using Domain.Entities.Users;
using Domain.Enums.Users;

namespace Application.Features.Users.Responses
{
    public record UserProfileResponse(
        Guid Id,
        string? Email,
        string FullName,
        string? PhoneNumber,
        string AvatarUrl,
        UserRole Role,
        UserStatus Status,
        string? Locale,
        bool MarketingConsent,
        bool HasPassword,
        DateTimeOffset? EmailVerifiedAt,
        DateTimeOffset? PhoneVerifiedAt,
        DateTimeOffset CreatedOnUtc)
    {
        public static UserProfileResponse From(User user) => new(
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.AvatarUrl,
            user.Role,
            user.Status,
            user.Locale,
            user.MarketingConsent,
            user.HasPassword,
            user.EmailVerifiedAt,
            user.PhoneVerifiedAt,
            user.CreatedOnUtc);
    }
}
