using Application.Common.Logging;
using Application.Interfaces.Database;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence
{
    public class DatabaseInitializer(IServiceScopeFactory scopeFactory, ILogger<DatabaseInitializer> logger) : IDatabaseInitializer
    {
        public async Task MigrateAsync()
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            try
            {
                var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
                if (pendingMigrations.Any())
                {
                    logger.LogIfEnabled(LogLevel.Information, "Applying pending migrations for database: {Migrations}", string.Join(", ", pendingMigrations));

                    await dbContext.Database.MigrateAsync();

                    logger.LogIfEnabled(LogLevel.Information, "Database migration completed successfully.");
                }
                else
                {
                    logger.LogIfEnabled(LogLevel.Information, "Database is already up to date. No migrations to apply.");
                }
            }
            catch (Exception ex)
            {
                logger.LogIfEnabled(LogLevel.Error, ex, "An error occurred while migrating the database.");
                throw;
            }
        }
    }
}
