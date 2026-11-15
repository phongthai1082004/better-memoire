using Domain.Abstractions.Repository.Common;
using Domain.Entities.Users;

namespace Domain.Abstractions.Repository
{
    public interface IAddressRepository : IBaseRepository<Address, int>
    {
        Task<IReadOnlyList<Address>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Address?> GetOwnedAsync(int id, Guid userId, CancellationToken cancellationToken = default);
        Task ClearDefaultAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
