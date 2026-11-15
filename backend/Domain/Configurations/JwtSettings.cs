namespace Domain.Configurations
{
    public class JwtSettings
    {
        public required string Key { get; set; }

        /// <summary>Separate signing key for refresh tokens; falls back to <see cref="Key"/> when empty.</summary>
        public string? RefreshKey { get; set; }

        public required string ClaimsIssuer { get; set; }
        public required string Audience { get; set; }
        public int AccessTokenExpirationMinutes { get; set; }
        public int RefreshTokenExpirationDays { get; set; }
    }
}
