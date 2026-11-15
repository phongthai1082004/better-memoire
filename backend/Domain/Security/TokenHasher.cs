using System.Security.Cryptography;
using System.Text;

namespace Domain.Security
{
    /// <summary>
    /// Refresh/OTP tokens are never persisted in plain text; only their SHA-256 hash is stored.
    /// </summary>
    public static class TokenHasher
    {
        public static string Hash(string rawToken)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(rawToken);
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
        }
    }
}
