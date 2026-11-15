using Application.CQRS;
using Application.Features.Users.Responses;

namespace Application.Features.Users.Commands
{
    public record UpdateMeCommand(
        string FullName,
        string? PhoneNumber,
        string? AvatarUrl,
        string? Locale,
        bool MarketingConsent) : ICommand<UserProfileResponse>;
}
