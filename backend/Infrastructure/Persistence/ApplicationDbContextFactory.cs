using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Persistence.Contexts
{
    /// <summary>
    /// Design-time factory so <c>dotnet ef</c> can build the model without starting the
    /// web host (which requires Redis and the full app configuration).
    /// Override the connection with <c>BETTER_MEMOIRE_DB</c>.
    /// </summary>
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var connectionString = Environment.GetEnvironmentVariable("BETTER_MEMOIRE_DB")
                ?? "Host=localhost;Port=5432;Database=better_memoire;Username=postgres;Password=postgres";

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            return new ApplicationDbContext(options);
        }
    }
}
