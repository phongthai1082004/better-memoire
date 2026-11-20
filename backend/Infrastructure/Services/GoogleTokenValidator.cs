using Application.Interfaces.Services;
using Domain.Errors;
using Domain.Exceptions.Common;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services
{
    public class GoogleTokenValidator(IConfiguration configuration) : IGoogleTokenValidator
    {
        public async Task<GoogleUserInfo> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
        {
            var clientId = configuration["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                throw new TransientFailureException(ErrorCode.AuthGoogleNotConfigured);

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });

                if (!payload.EmailVerified)
                    throw new UnauthorizedException(ErrorCode.AuthGoogleEmailNotVerified);

                if (string.IsNullOrWhiteSpace(payload.Email))
                    throw new UnauthorizedException(ErrorCode.AuthGoogleNoEmail);

                return new GoogleUserInfo(payload.Subject, payload.Email, payload.EmailVerified, payload.Name, payload.Picture);
            }
            catch (TransientFailureException)
            {
                throw;
            }
            catch (UnauthorizedException)
            {
                throw;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                throw new TransientFailureException(ErrorCode.AuthGoogleUnavailable, ex);
            }
            catch (Exception)
            {
                throw new UnauthorizedException(ErrorCode.AuthGoogleInvalid);
            }
        }
    }
}
