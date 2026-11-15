using Application.Interfaces.Services;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Resources;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Json;

namespace Infrastructure.Services
{
    public class ResendEmailService(
        HttpClient httpClient,
        IConfiguration configuration,
        IStringLocalizer<Message> localizer,
        ILogger<ResendEmailService> logger) : IEmailService
    {
        private readonly string? _apiKey = configuration["Resend:ApiKey"];
        private readonly string _from = configuration["Resend:From"] ?? "onboarding@resend.dev";
        private readonly string _baseUrl = (configuration["Resend:BaseUrl"] ?? "https://api.resend.com").TrimEnd('/');

        public async Task SendOtpAsync(
            string email,
            string code,
            int expiryMinutes,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
                throw new TransientFailureException(ErrorCode.AuthEmailNotConfigured);

            httpClient.Timeout = TimeSpan.FromSeconds(15);
            httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            var payload = new
            {
                from = _from,
                to = new[] { email },
                subject = localizer["Email.OtpSubject"].Value,
                html = BuildHtml(code, expiryMinutes)
            };

            HttpResponseMessage response;
            try
            {
                response = await httpClient.PostAsJsonAsync($"{_baseUrl}/emails", payload, cancellationToken);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                logger.LogWarning(ex, "OTP email delivery failed for {Email}", email);
                throw new TransientFailureException(ErrorCode.AuthEmailUnavailable, ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning(
                    "OTP email provider returned {StatusCode} for {Email}: {Body}",
                    (int)response.StatusCode,
                    email,
                    body.Length > 300 ? body[..300] : body);

                throw new TransientFailureException(ErrorCode.AuthEmailUnavailable);
            }

            logger.LogInformation("OTP email accepted by provider for {Email}", email);
        }

        private string BuildHtml(string code, int expiryMinutes)
        {
            var safeCode = WebUtility.HtmlEncode(code);
            var intro = WebUtility.HtmlEncode(localizer["Email.OtpIntro", expiryMinutes].Value);
            var ignore = WebUtility.HtmlEncode(localizer["Email.OtpIgnore"].Value);
            var note = WebUtility.HtmlEncode(localizer["Email.OtpEnglish", expiryMinutes].Value);

            return $"""
                <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#141a16;background:#f3f2ea;border-radius:20px">
                  <p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#5c675f;margin:0 0 24px">Better Memoire</p>
                  <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px">{WebUtility.HtmlEncode(localizer["Email.OtpTitle"].Value)}</h1>
                  <p style="font-size:15px;line-height:1.7;color:#414c45;margin:0 0 24px">{intro}</p>
                  <p style="font-family:monospace;font-size:34px;letter-spacing:.28em;font-weight:700;background:#faf9f3;border:1px solid #d6d7c8;border-radius:12px;padding:18px 20px;text-align:center;margin:0 0 24px">
                    {safeCode}
                  </p>
                  <p style="font-size:13px;line-height:1.6;color:#5c675f;margin:0">
                    {ignore}
                  </p>
                  <p style="font-size:12px;line-height:1.6;color:#7f8a80;margin:24px 0 0">
                    {note}
                  </p>
                </div>
                """;
        }
    }
}
