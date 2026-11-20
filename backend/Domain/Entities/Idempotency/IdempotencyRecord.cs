using System.Security.Cryptography;
using System.Text;
using Domain.Abstractions.Entities;
using Domain.Enums.Idempotency;

namespace Domain.Entities.Idempotency
{
    /// <summary>
    /// Persisted idempotency record. Hard-deleted by a TTL cleanup job; no soft delete.
    /// </summary>
    public class IdempotencyRecord : BaseEntity<int>
    {
        public string Key { get; private set; } = string.Empty;
        public Guid? UserId { get; private set; }
        public string Endpoint { get; private set; } = string.Empty;
        public string? RequestHash { get; private set; }
        public IdempotencyStatus Status { get; private set; } = IdempotencyStatus.Pending;
        public int? ResponseStatusCode { get; private set; }
        public string? ResponseBody { get; private set; }
        public string? ResponseContentType { get; private set; }
        public DateTimeOffset ExpiresAt { get; private set; }

        private IdempotencyRecord()
        {
        }

        public IdempotencyRecord(string key, Guid? userId, string endpoint, string? requestHash, DateTimeOffset expiresAt)
        {
            Key = key;
            UserId = userId;
            Endpoint = endpoint;
            RequestHash = requestHash;
            ExpiresAt = expiresAt;
        }

        public void Complete(int statusCode, string? body, string? contentType)
        {
            Status = IdempotencyStatus.Completed;
            ResponseStatusCode = statusCode;
            ResponseBody = body;
            ResponseContentType = contentType;
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(1);
        }

        public bool IsExpired(DateTimeOffset now) => ExpiresAt <= now;

        public void MarkFailed() => Status = IdempotencyStatus.Failed;

        /// <summary>
        /// Computes a SHA-256 hash using the provided endpoint, userId, and request payload.
        /// </summary>
        public static string ComputeRequestHash(string endpoint, Guid? userId, string? requestBody)
        {
            string rawPayload = string.Join("|",
                endpoint,
                userId?.ToString() ?? string.Empty,
                requestBody ?? string.Empty
            );

            byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawPayload));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
    }
}
