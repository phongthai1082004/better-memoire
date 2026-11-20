using Application.Common.Logging;
using Application.Interfaces.Services;
using Domain.Abstractions.Auditable;
using Domain.Abstractions.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
namespace Infrastructure.Persistence.Interceptors
{
    public class AuditInterceptor(ICurrentUserService currnetUserService, ILogger<AuditInterceptor> logger) : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            Update(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            Update(eventData.Context);
            return base.SavingChanges(eventData, result);
        }
        private void Update(DbContext? dbContext)
        {
            if (dbContext == null) return;
            var utcNow = DateTime.UtcNow;
            var currentUserId = currnetUserService.UserId;

            foreach (var entry in dbContext.ChangeTracker.Entries())
            {
                // Immutable/append-only records must never be deleted (Order, ledger, audit trail, ...).
                if (entry.State == EntityState.Deleted && entry.Entity is IImmutableEntity)
                    throw new InvalidOperationException($"{entry.Metadata.ClrType.Name} is immutable and cannot be deleted.");

                if (entry.State == EntityState.Deleted && entry.Entity is ISoftDelete softDeletable)
                {
                    logger.LogIfEnabled(LogLevel.Debug, "Soft-delete {Entity}", entry.Metadata.ClrType.Name);
                    entry.State = EntityState.Modified;
                    softDeletable.IsDeleted = true;
                    softDeletable.DeletedOnUtc = utcNow;
                    softDeletable.DeletedBy = currentUserId;
                    continue;
                }

                if (entry.Entity is IAuditable auditable)
                {
                    if (entry.State == EntityState.Added)
                    {
                        logger.LogDebug("Stamp created {Entity}", entry.Metadata.ClrType.Name);
                        auditable.CreatedOnUtc = utcNow;
                        auditable.CreatedBy = currentUserId;
                    }

                    if (entry.State == EntityState.Modified)
                    {
                        logger.LogDebug("Stamp modified {Entity}", entry.Metadata.ClrType.Name);
                        auditable.LastModifiedOnUtc = utcNow;
                        auditable.LastModifiedBy = currentUserId;
                    }
                }
            }
        }
    }
}
