using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Application.Common.Logging;
using Application.Interfaces.Services;
using Domain.Configurations;
using Domain.Errors;
using Domain.Exceptions.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services
{
    public class R2StorageService(IOptions<R2Settings> options, HttpClient httpClient, ILogger<R2StorageService> logger) : IStorageService
    {
        private const string FolderPrefix = "echotrace/";
        private readonly R2Settings _settings = options.Value;

        public Task<UploadTicket> CreateUploadTicketAsync(string folder, CancellationToken cancellationToken = default)
        {
            EnsureConfigured();
            if (!folder.StartsWith(FolderPrefix, StringComparison.Ordinal))
                throw new BadRequestException(ErrorCode.MediaInvalidUrl);
            var expiry = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + 600;
            var token = HmacHex($"{folder}:{expiry}");
            return Task.FromResult(new UploadTicket(_settings.WorkerUrl, token, folder, expiry));
        }

        public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
        {
            EnsureConfigured();
            using var request = new HttpRequestMessage(HttpMethod.Delete, _settings.WorkerUrl)
            {
                Content = JsonContent.Create(new { publicId })
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.AdminToken);
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogIfEnabled(LogLevel.Warning, "R2 delete failed for {PublicId}: {Status}", publicId, response.StatusCode);
                throw new TransientFailureException(ErrorCode.MediaUploadUnavailable);
            }
        }

        public bool IsOwnedUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return false;
            if (!Uri.TryCreate(_settings.WorkerUrl, UriKind.Absolute, out var worker))
                return false;
            return uri.Scheme == Uri.UriSchemeHttps &&
                   string.Equals(uri.Host, worker.Host, StringComparison.OrdinalIgnoreCase) &&
                   uri.AbsolutePath.TrimStart('/').StartsWith(FolderPrefix, StringComparison.Ordinal);
        }

        private void EnsureConfigured()
        {
            if (string.IsNullOrWhiteSpace(_settings.WorkerUrl) || string.IsNullOrWhiteSpace(_settings.UploadSecret) || string.IsNullOrWhiteSpace(_settings.AdminToken))
            {
                throw new TransientFailureException(ErrorCode.MediaStorageNotConfigured);
            }
        }

        private string HmacHex(string value)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_settings.UploadSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
