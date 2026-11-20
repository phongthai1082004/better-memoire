using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Configurations;
using Domain.Entities.Users;
using Domain.Enums.Users;
using Microsoft.AspNetCore.Http;

namespace Application.Services
{
    public class AuthTokenIssuer(IJwtService jwtService, JwtSettings jwtSettings, IHttpContextAccessor httpContextAccessor) : IAuthTokenIssuer
    {
        public AuthResponse Issue(User user)
        {
            var email = user.Email ?? string.Empty;
            var role = user.Role.ToString();
            var accessToken = jwtService.GenerateAccessToken(user.Id, email, role);
            var refreshToken = jwtService.GenerateRefreshToken(user.Id, email, role);

            var context = httpContextAccessor.HttpContext;
            var userAgent = Truncate(context?.Request.Headers.UserAgent.ToString(), 500);
            var ip = Truncate(context?.Connection.RemoteIpAddress?.ToString(), 64);
            var deviceId = Truncate(context?.Request.Headers["X-Device-Id"].FirstOrDefault(), 128);

            user.AddToken(
                refreshToken,
                TokenType.RefreshToken,
                DateTimeOffset.UtcNow.AddDays(jwtSettings.RefreshTokenExpirationDays),
                userAgent,
                ip,
                deviceId);

            return new AuthResponse(accessToken, refreshToken);
        }

        private static string? Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            return value.Length <= maxLength ? value : value[..maxLength];
        }
    }
}
