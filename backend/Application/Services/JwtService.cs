using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Interfaces.Services;
using Domain.Configurations;
using Microsoft.IdentityModel.Tokens;

namespace Application.Services
{
    public class JwtService(JwtSettings jwtSettings) : IJwtService
    {
        private readonly JwtSettings _jwtSettings = jwtSettings;

        private string RefreshKey =>
            string.IsNullOrWhiteSpace(_jwtSettings.RefreshKey) ? _jwtSettings.Key : _jwtSettings.RefreshKey;

        public string GenerateAccessToken(Guid userId, string email, string role)
            => WriteToken(
                userId,
                email,
                role,
                DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                _jwtSettings.Key,
                "access");

        public string GenerateRefreshToken(Guid userId, string email, string role)
            => WriteToken(
                userId,
                email,
                role,
                DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                RefreshKey,
                "refresh");

        public Guid? ValidateRefreshToken(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return null;

            var handler = new JwtSecurityTokenHandler();
            try
            {
                var principal = handler.ValidateToken(refreshToken, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _jwtSettings.ClaimsIssuer,
                    ValidAudience = _jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(RefreshKey)),
                    ClockSkew = TimeSpan.FromSeconds(30)
                }, out _);

                var value = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return Guid.TryParse(value, out var userId) ? userId : null;
            }
            catch (SecurityTokenException)
            {
                return null;
            }
            catch (ArgumentException)
            {
                return null;
            }
        }

        public string HashPassword(string password)
            => BCrypt.Net.BCrypt.HashPassword(password);

        public bool VerifyPassword(string providedPassword, string hashedPassword)
            => BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);

        private string WriteToken(Guid userId, string email, string role, DateTime expires, string key, string tokenType)
        {
            var handler = new JwtSecurityTokenHandler();
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim("token_type", tokenType)
                ]),
                Expires = expires,
                Issuer = _jwtSettings.ClaimsIssuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            return handler.WriteToken(handler.CreateToken(descriptor));
        }
    }
}
