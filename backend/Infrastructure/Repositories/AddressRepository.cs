using Domain.Abstractions.Repository;
using Domain.Entities.Users;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories
{
    public class AddressRepository(
        ApplicationDbContext context,
        ILoggerFactory loggerFactory)
        : BaseRepository<Address, int>(context, loggerFactory), IAddressRepository
    {
        public async Task<IReadOnlyList<Address>> GetForUserAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await dbSet
                .AsNoTracking()
                .Where(address => address.UserId == userId)
                .OrderByDescending(address => address.IsDefault)
                .ThenByDescending(address => address.CreatedOnUtc)
                .ToListAsync(cancellationToken);
        }

        public async Task<Address?> GetOwnedAsync(
            int id,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await dbSet.FirstOrDefaultAsync(
                address => address.Id == id && address.UserId == userId,
                cancellationToken);
        }

        public async Task ClearDefaultAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var defaults = await dbSet
                .Where(address => address.UserId == userId && address.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var address in defaults)
                address.UnsetDefault();
        }
    }
}
