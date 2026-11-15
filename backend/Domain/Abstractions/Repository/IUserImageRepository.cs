using Domain.Abstractions.Repository.Common;
using Domain.Entities.Media;

namespace Domain.Abstractions.Repository
{
    public interface IUserImageRepository : IBaseRepository<UserImage, Guid>
    {
        Task<UserImage?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<UserImage>> GetForUserAsync(Guid userId, int limit, CancellationToken cancellationToken = default);
    }
}
