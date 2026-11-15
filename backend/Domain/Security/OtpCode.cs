using System.Globalization;
using System.Security.Cryptography;

namespace Domain.Security
{
    /// <summary>Cryptographically random 6-digit verification code.</summary>
    public static class OtpCode
    {
        public static string Generate()
            => RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString(CultureInfo.InvariantCulture);
    }
}
