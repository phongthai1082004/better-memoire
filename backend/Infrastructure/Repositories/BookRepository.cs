using Domain.Abstractions.Repository;
using Domain.Entities.Books;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories
{
    public class BookRepository(ApplicationDbContext context, ILoggerFactory loggerFactory)
        : BaseRepository<Book, Guid>(context, loggerFactory), IBookRepository
    {
        public async Task<Book?> GetOwnedAsync(Guid id, Guid userId, bool includePages, CancellationToken cancellationToken = default)
        {
            var query = dbSet.AsQueryable();
            if (includePages) query = query.Include(book => book.Pages);
            return await query.FirstOrDefaultAsync(book => book.Id == id && book.UserId == userId, cancellationToken);
        }

        public async Task<IReadOnlyList<Book>> ListForUserAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await dbSet
                .AsNoTracking()
                .Include(book => book.Pages)
                .Where(book => book.UserId == userId)
                .OrderByDescending(book => book.LastModifiedOnUtc ?? book.CreatedOnUtc)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<BookPage>> GetPageWindowAsync(Guid bookId, int from, int to, CancellationToken cancellationToken = default)
        {
            return await Context.BookPages
                .AsNoTracking()
                .Where(page => page.BookId == bookId && page.Position >= from && page.Position <= to)
                .OrderBy(page => page.Position)
                .ToListAsync(cancellationToken);
        }

        public async Task<BookPageEvent?> FindEventAsync(string pageId, Guid clientMutationId, CancellationToken cancellationToken = default)
        {
            return await Context.BookPageEvents
                .AsNoTracking()
                .FirstOrDefaultAsync(pageEvent => pageEvent.PageId == pageId && pageEvent.ClientMutationId == clientMutationId, cancellationToken);
        }

        public void InsertEvent(BookPageEvent pageEvent) => Context.BookPageEvents.Add(pageEvent);

        public void DeletePage(BookPage page) => Context.BookPages.Remove(page);
    }
}
