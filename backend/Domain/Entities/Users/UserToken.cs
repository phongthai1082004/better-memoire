using Domain.Abstractions.Entities;
using Domain.Enums.Users;
using Domain.Security;

namespace Domain.Entities.Users
{
    /// <summary>
    /// Refresh/OTP credential owned by <see cref="User"/>. Only the SHA-256 hash is stored.
    /// Hard-deleted by the token purge job once revoked or expired.
    /// </summary>
    public class UserToken : BaseEntity<int>
    {
        public Guid UserId { get; private set; }
        public string TokenHash { get; private set; } = string.Empty;
        public TokenType Type { get; private set; }
        public bool IsRevoked { get; private set; }
        public string? UserAgent { get; private set; }
        public string? Ip { get; private set; }
        public string? DeviceId { get; private set; }
        public DateTimeOffset ExpiresAt { get; private set; }

        private UserToken()
        {
        }

        public UserToken(
            Guid userId,
            string rawToken,
            TokenType type,
            DateTimeOffset expiresAt,
            string? userAgent = null,
            string? ip = null,
            string? deviceId = null)
        {
            UserId = userId;
            TokenHash = TokenHasher.Hash(rawToken);
            Type = type;
            ExpiresAt = expiresAt;
            UserAgent = userAgent;
            Ip = ip;
            DeviceId = deviceId;
        }

        public void Revoke() => IsRevoked = true;

        public bool IsExpired(DateTimeOffset now) => ExpiresAt <= now;

        public bool IsValid(DateTimeOffset now) => !IsRevoked && !IsExpired(now);

        public bool Matches(string rawToken) => string.Equals(TokenHash, TokenHasher.Hash(rawToken), StringComparison.Ordinal);
    }
}
