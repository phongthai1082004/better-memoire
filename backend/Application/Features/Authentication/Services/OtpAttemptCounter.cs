using Application.Cache.Common;

namespace Application.Features.Authentication.Services
{
    /// <summary>Redis-backed failed OTP attempt counter (1 hour window).</summary>
    public class OtpAttemptCounter(ICacheService cache)
    {
        private static readonly TimeSpan Window = TimeSpan.FromHours(1);

        public async Task<int> GetAsync(string email)
            => await cache.GetAsync<int>(CacheKeys.OtpFailure(email));

        public async Task<int> IncrementAsync(string email, CancellationToken cancellationToken = default)
        {
            var key = CacheKeys.OtpFailure(email);
            var current = await cache.GetAsync<int>(key);
            var next = current + 1;
            await cache.SetAsync(key, next, Window);
            return next;
        }

        public Task ResetAsync(string email)
            => cache.RemoveAsync(CacheKeys.OtpFailure(email));
    }
}
