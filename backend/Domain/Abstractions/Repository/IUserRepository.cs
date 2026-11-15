using Domain.Abstractions.Repository.Common;
using Domain.Entities.Users;

namespace Domain.Abstractions.Repository
{
    public interface IUserRepository : IBaseRepository<User, Guid>
    {
        Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<User?> GetUserByEmailWithTokensAsync(string email, CancellationToken cancellationToken = default);
        Task<User?> GetUserByIdWithTokensAsync(Guid id, CancellationToken cancellationToken = default);
        Task<User?> GetUserByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default);
        Task<User?> GetUserByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default);
        Task<bool> CheckUserByEmail(string email, CancellationToken cancellationToken = default);
    }
}
