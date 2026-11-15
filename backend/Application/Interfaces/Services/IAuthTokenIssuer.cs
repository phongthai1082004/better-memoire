using Application.Features.Authentication.Responses;
using Domain.Entities.Users;

namespace Application.Interfaces.Services
{
    /// <summary>Issues an access/refresh pair and records the refresh token hash on the user.</summary>
    public interface IAuthTokenIssuer
    {
        AuthResponse Issue(User user);
    }
}
