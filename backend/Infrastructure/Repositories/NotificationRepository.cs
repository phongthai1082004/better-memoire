using Domain.Abstractions.Repository;
using Domain.Entities.Notifications;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories
{
    public class NotificationRepository(
        ApplicationDbContext context,
        ILoggerFactory loggerFactory)
        : BaseRepository<Notification, Guid>(context, loggerFactory), INotificationRepository
    {
        public async Task<IReadOnlyList<Notification>> GetForUserAsync(
            Guid userId,
            int limit,
            CancellationToken cancellationToken = default)
        {
            return await dbSet
                .AsNoTracking()
                .Where(notification => notification.UserId == userId)
                .OrderByDescending(notification => notification.CreatedOnUtc)
                .ThenByDescending(notification => notification.Id)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }

        public async Task<Notification?> GetByIdForUserAsync(
            Guid id,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await dbSet.FirstOrDefaultAsync(
                notification => notification.Id == id && notification.UserId == userId,
                cancellationToken);
        }

        public async Task<int> CountUnreadAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await dbSet.CountAsync(
                notification => notification.UserId == userId && !notification.IsRead,
                cancellationToken);
        }
    }
}
