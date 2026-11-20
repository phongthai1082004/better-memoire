using Application.Interfaces.Database;
using Domain.Abstractions.Entities;
using Domain.Entities.Books;
using Domain.Entities.Carts;
using Domain.Entities.Coupons;
using Domain.Entities.DecorAssets;
using Domain.Entities.Financial;
using Domain.Entities.Idempotency;
using Domain.Entities.Media;
using Domain.Entities.Notifications;
using Domain.Entities.Ops;
using Domain.Entities.Orders;
using Domain.Entities.Payments;
using Domain.Entities.PrintOptions;
using Domain.Entities.SampleBooks;
using Domain.Entities.Suppliers;
using Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Contexts
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options), IApplicationDbContext
    {
        // Identity
        public DbSet<User> Users => Set<User>();
        public DbSet<UserToken> UserTokens => Set<UserToken>();
        public DbSet<ExternalToken> ExternalTokens => Set<ExternalToken>();
        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        // Media
        public DbSet<UserImage> UserImages => Set<UserImage>();

        // Books & catalog
        public DbSet<Book> Books => Set<Book>();
        public DbSet<BookPage> BookPages => Set<BookPage>();
        public DbSet<BookPageEvent> BookPageEvents => Set<BookPageEvent>();
        public DbSet<SampleBook> SampleBooks => Set<SampleBook>();
        public DbSet<DecorAsset> DecorAssets => Set<DecorAsset>();
        public DbSet<PrintOption> PrintOptions => Set<PrintOption>();

        // Commerce
        public DbSet<Cart> Carts => Set<Cart>();
        public DbSet<CartItem> CartItems => Set<CartItem>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
        public DbSet<Coupon> Coupons => Set<Coupon>();
        public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();

        // Payments & financial ledger
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<Cashflow> Cashflows => Set<Cashflow>();
        public DbSet<Income> Incomes => Set<Income>();
        public DbSet<Expense> Expenses => Set<Expense>();
        public DbSet<FinancePeriod> FinancePeriods => Set<FinancePeriod>();

        // Supply chain & operations
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<SupplierPrintOption> SupplierPrintOptions => Set<SupplierPrintOption>();
        public DbSet<MaintenanceWindow> MaintenanceWindows => Set<MaintenanceWindow>();
        public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

            // Domain events are in-memory only and never persisted.
            foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                         .Where(t => typeof(IAggregate).IsAssignableFrom(t.ClrType)))
            {
                modelBuilder.Entity(entityType.ClrType).Ignore(nameof(IAggregate.DomainEvents));
            }
        }

        public async Task<IDbTransactionContext> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            var efTx = await Database.BeginTransactionAsync(cancellationToken);
            return new EfDbTransactionContext(efTx);
        }
    }
}
