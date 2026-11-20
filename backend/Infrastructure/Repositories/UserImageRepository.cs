using Domain.Abstractions.Repository;
using Domain.Entities.Media;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories
{
    public class UserImageRepository(ApplicationDbContext context, ILoggerFactory loggerFactory)
        : BaseRepository<UserImage, Guid>(context, loggerFactory), IUserImageRepository
    {
        public async Task<UserImage?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
        {
            return await dbSet.FirstOrDefaultAsync(image => image.Id == id && image.UserId == userId, cancellationToken);
        }

        public async Task<IReadOnlyList<UserImage>> GetForUserAsync(Guid userId, int limit, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .AsNoTracking()
                .Where(image => image.UserId == userId)
                .OrderByDescending(image => image.CreatedOnUtc)
                .ThenByDescending(image => image.Id)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }
    }
}
