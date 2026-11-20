using Domain.Abstractions.Entities;
using Domain.Enums.Users;

namespace Domain.Entities.Users
{
    /// <summary>
    /// External identity provider credentials. Hard-deleted when the user disconnects
    /// the provider; cascade-deleted with the user.
    /// </summary>
    public class ExternalToken : BaseEntity<int>
    {
        public Guid UserId { get; private set; }
        public ExternalProvider Provider { get; private set; }
        public string ProviderUserId { get; private set; } = string.Empty;
        public string AccessToken { get; private set; } = string.Empty;
        public string? RefreshToken { get; private set; }
        public DateTimeOffset? ExpiresAt { get; private set; }

        private ExternalToken()
        {
        }

        public ExternalToken(Guid userId, ExternalProvider provider, string providerUserId, string accessToken, string? refreshToken, DateTimeOffset? expiresAt)
        {
            UserId = userId;
            Provider = provider;
            ProviderUserId = providerUserId;
            AccessToken = accessToken;
            RefreshToken = refreshToken;
            ExpiresAt = expiresAt;
        }

        public void UpdateTokens(string accessToken, string? refreshToken, DateTimeOffset? expiresAt)
        {
            AccessToken = accessToken;
            RefreshToken = refreshToken;
            ExpiresAt = expiresAt;
        }

        public bool IsExpired(DateTimeOffset now) => ExpiresAt.HasValue && ExpiresAt.Value <= now;
    }
}
