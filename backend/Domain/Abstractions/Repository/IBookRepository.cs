using Domain.Abstractions.Repository.Common;
using Domain.Entities.Books;

namespace Domain.Abstractions.Repository
{
    public interface IBookRepository : IBaseRepository<Book, Guid>
    {
        Task<Book?> GetOwnedAsync(Guid id, Guid userId, bool includePages, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Book>> ListForUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<BookPage>> GetPageWindowAsync(Guid bookId, int from, int to, CancellationToken cancellationToken = default);
        Task<BookPageEvent?> FindEventAsync(string pageId, Guid clientMutationId, CancellationToken cancellationToken = default);
        void InsertEvent(BookPageEvent pageEvent);
        void DeletePage(BookPage page);
    }
}
