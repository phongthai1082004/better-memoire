using Domain.Abstractions.Entities;
using Domain.Enums.Users;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Security;

namespace Domain.Entities.Users
{
    /// <summary>
    /// Identity aggregate root (soft delete), owning tokens, external identities and
    /// the address book. Ban is a status change, not a delete; soft delete is the
    /// GDPR erasure path and anonymises PII while keeping the row for order/FK integrity.
    /// </summary>
    public class User : SoftDeleteAggregateRoot
    {
        private readonly List<UserToken> _tokens = [];
        private readonly List<ExternalToken> _externalTokens = [];
        private readonly List<Address> _addresses = [];

        public string? Email { get; private set; }
        public string? PasswordHash { get; private set; }
        public string FullName { get; private set; } = string.Empty;
        public string AvatarUrl { get; private set; } = string.Empty;
        public string? PhoneNumber { get; private set; }
        public UserRole Role { get; private set; } = UserRole.User;
        public UserStatus Status { get; private set; } = UserStatus.Unactivated;

        public string? GoogleId { get; private set; }
        public DateTimeOffset? EmailVerifiedAt { get; private set; }
        public DateTimeOffset? PhoneVerifiedAt { get; private set; }
        public DateTimeOffset? LastLoginAt { get; private set; }
        public string? Locale { get; private set; }
        public bool MarketingConsent { get; private set; }

        public string? FirstUtmSource { get; private set; }
        public string? FirstUtmMedium { get; private set; }
        public string? FirstUtmCampaign { get; private set; }

        public IReadOnlyCollection<UserToken> Tokens => _tokens.AsReadOnly();
        public IReadOnlyCollection<ExternalToken> ExternalTokens => _externalTokens.AsReadOnly();
        public IReadOnlyCollection<Address> Addresses => _addresses.AsReadOnly();

        private User()
        {
        }

        public User(string? email, string fullName, string? passwordHash, string? phoneNumber = null)
        {
            Email = email;
            FullName = fullName;
            PasswordHash = passwordHash;
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        }

        public void Activate()
        {
            if (Status == UserStatus.Banned)
                throw new DomainRuleException(ErrorCode.UserCannotActivateBanned);

            Status = UserStatus.Active;
        }

        public void Ban()
        {
            Status = UserStatus.Banned;
            RevokeAllTokens();
        }

        public void Unban()
        {
            if (Status != UserStatus.Banned)
                return;

            Status = UserStatus.Active;
        }

        public void UpdateProfile(string fullName, string? phoneNumber, string avatarUrl)
        {
            if (string.IsNullOrWhiteSpace(fullName))
                throw new DomainRuleException(ErrorCode.UserFullNameRequired);

            FullName = fullName;
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
            AvatarUrl = avatarUrl;
        }

        public void UpdatePreferences(string? locale, bool marketingConsent)
        {
            Locale = locale;
            MarketingConsent = marketingConsent;
        }

        public void ChangePassword(string newPasswordHash)
        {
            if (string.IsNullOrWhiteSpace(newPasswordHash))
                throw new DomainRuleException(ErrorCode.UserPasswordRequired);

            PasswordHash = newPasswordHash;
            RevokeAllTokens();
        }

        public void ChangeEmail(string newEmail)
        {
            Email = newEmail;
            EmailVerifiedAt = null;
            Status = UserStatus.Unactivated;
        }

        public void ChangePhoneNumber(string? phoneNumber)
        {
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
            PhoneVerifiedAt = null;
        }

        public void VerifyEmail(DateTimeOffset at) => EmailVerifiedAt = at;

        public void VerifyPhone(DateTimeOffset at) => PhoneVerifiedAt = at;

        public void RecordLogin(DateTimeOffset at)
        {
            LastLoginAt = at;
            if (Status == UserStatus.Unactivated)
                Status = UserStatus.Active;
        }

        public void LinkGoogleAccount(string googleId, string? avatarUrl, DateTimeOffset at)
        {
            GoogleId = googleId;
            EmailVerifiedAt ??= at;
            if (!string.IsNullOrWhiteSpace(avatarUrl))
                AvatarUrl = avatarUrl;
        }

        /// <summary>
        /// First-touch attribution only: once a source is stamped it is never overwritten.
        /// Values are normalised to lower case and truncated to 64/64/128 characters.
        /// </summary>
        public void StampAttribution(string? source, string? medium, string? campaign)
        {
            if (!string.IsNullOrWhiteSpace(FirstUtmSource) || string.IsNullOrWhiteSpace(source))
                return;

            FirstUtmSource = Normalise(source, 64);
            FirstUtmMedium = Normalise(medium, 64);
            FirstUtmCampaign = Normalise(campaign, 128);
        }

        public UserToken AddToken(string rawToken, TokenType type, DateTimeOffset expiresAt, string? userAgent = null, string? ip = null, string? deviceId = null)
        {
            var token = new UserToken(Id, rawToken, type, expiresAt, userAgent, ip, deviceId);
            _tokens.Add(token);
            return token;
        }

        public bool HasPassword => !string.IsNullOrWhiteSpace(PasswordHash);

        public UserToken? FindToken(string rawToken, TokenType type)
            => _tokens.FirstOrDefault(t => t.Type == type && t.Matches(rawToken));

        public UserToken? FindRefreshToken(string rawToken)
            => FindToken(rawToken, TokenType.RefreshToken);

        /// <summary>
        /// Consumes a one-time OTP. Only the newest matching, unrevoked, unexpired token is accepted.
        /// </summary>
        public bool ConsumeOtp(string rawOtp, DateTimeOffset now)
        {
            var token = _tokens
                .Where(t => t.Type == TokenType.Otp && !t.IsRevoked && t.ExpiresAt > now)
                .OrderByDescending(t => t.CreatedOnUtc)
                .FirstOrDefault(t => t.Matches(rawOtp));

            if (token is null)
                return false;

            token.Revoke();
            return true;
        }

        public void RevokeOtpTokens()
        {
            foreach (var token in _tokens.Where(t => t.Type == TokenType.Otp && !t.IsRevoked))
                token.Revoke();
        }

        public void RevokeToken(int tokenId)
        {
            var token = _tokens.FirstOrDefault(t => t.Id == tokenId);
            token?.Revoke();
        }

        public void RevokeAllTokens()
        {
            foreach (var token in _tokens.Where(t => !t.IsRevoked))
                token.Revoke();
        }

        public void RevokeExpiredTokens(DateTimeOffset now)
        {
            foreach (var token in _tokens.Where(t => !t.IsRevoked && t.ExpiresAt <= now))
                token.Revoke();
        }

        public void AddExternalToken(ExternalProvider provider, string providerUserId, string accessToken, string? refreshToken, DateTimeOffset? expiresAt)
        {
            if (_externalTokens.Any(t => t.Provider == provider))
                throw new DomainRuleException(ErrorCode.UserExternalTokenExists);

            _externalTokens.Add(new ExternalToken(Id, provider, providerUserId, accessToken, refreshToken, expiresAt));
        }

        public void UpdateExternalToken(ExternalProvider provider, string accessToken, string? refreshToken, DateTimeOffset? expiresAt)
        {
            var token = _externalTokens.FirstOrDefault(t => t.Provider == provider)
                ?? throw new DomainRuleException(ErrorCode.UserExternalTokenMissing);
            token.UpdateTokens(accessToken, refreshToken, expiresAt);
        }

        public void RemoveExternalToken(ExternalProvider provider)
        {
            var token = _externalTokens.FirstOrDefault(t => t.Provider == provider);
            if (token != null)
                _externalTokens.Remove(token);
        }

        public bool IsTokenValid(int tokenId, DateTimeOffset now)
        {
            var token = _tokens.FirstOrDefault(t => t.Id == tokenId);
            return token != null && token.IsValid(now);
        }

        public Address AddAddress(string recipientName, string phone, string province, string district, string ward, string street, bool isDefault)
        {
            if (isDefault)
                ClearDefaultAddress();

            var address = new Address(Id, recipientName, phone, province, district, ward, street, isDefault);
            _addresses.Add(address);
            return address;
        }

        private void ClearDefaultAddress()
        {
            foreach (var address in _addresses.Where(a => a.IsDefault && !a.IsDeleted))
                address.UnsetDefault();
        }

        /// <summary>
        /// GDPR erasure: keep the row (order/financial FKs stay valid) but anonymise PII
        /// and revoke every credential.
        /// </summary>
        public void SoftDelete(DateTimeOffset? at = null)
        {
            if (IsDeleted)
                return;

            IsDeleted = true;
            DeletedOnUtc = at ?? DateTimeOffset.UtcNow;

            Email = null;
            PhoneNumber = null;
            PasswordHash = null;
            GoogleId = null;
            AvatarUrl = string.Empty;
            FullName = "Deleted user";
            Locale = null;
            MarketingConsent = false;
            FirstUtmSource = null;
            FirstUtmMedium = null;
            FirstUtmCampaign = null;

            RevokeAllTokens();
            foreach (var externalToken in _externalTokens.ToList())
                _externalTokens.Remove(externalToken);

            foreach (var address in _addresses.Where(a => !a.IsDeleted))
                address.SoftDelete(at);
        }

        private static string? Normalise(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var normalised = value.Trim().ToLowerInvariant();
            return normalised.Length > maxLength ? normalised[..maxLength] : normalised;
        }
    }
}
