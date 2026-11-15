using Domain.Abstractions.Repository.Common;
using Domain.Entities.Notifications;

namespace Domain.Abstractions.Repository
{
    public interface INotificationRepository : IBaseRepository<Notification, Guid>
    {
        Task<IReadOnlyList<Notification>> GetForUserAsync(Guid userId, int limit, CancellationToken cancellationToken = default);
        Task<Notification?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
        Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
