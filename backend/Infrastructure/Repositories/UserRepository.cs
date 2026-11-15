using Domain.Abstractions.Repository;
using Domain.Entities.Users;
using Domain.Enums.Users;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories
{
    public class UserRepository(
        ApplicationDbContext context,
        ILoggerFactory loggerFactory) : BaseRepository<User, Guid>(context, loggerFactory), IUserRepository
    {
        public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return await dbSet.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
        }

        public async Task<User?> GetUserByEmailWithTokensAsync(string email, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .Include(user => user.Tokens)
                .FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
        }

        public async Task<User?> GetUserByIdWithTokensAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .Include(user => user.Tokens)
                .FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
        }

        public async Task<User?> GetUserByGoogleIdAsync(string googleId, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .Include(user => user.Tokens)
                .FirstOrDefaultAsync(user => user.GoogleId == googleId, cancellationToken);
        }

        public async Task<User?> GetUserByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .Include(user => user.Tokens)
                .FirstOrDefaultAsync(
                    user => user.Tokens.Any(token =>
                        token.TokenHash == tokenHash && token.Type == TokenType.RefreshToken),
                    cancellationToken);
        }

        public async Task<bool> CheckUserByEmail(string email, CancellationToken cancellationToken = default)
        {
            return await dbSet.AnyAsync(user => user.Email == email, cancellationToken);
        }
    }
}
