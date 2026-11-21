using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Queries
{
    public record ListMyBooksQuery : IQuery<IReadOnlyList<BookManifestResponse>>;

    public class ListMyBooksQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : IQueryHandler<ListMyBooksQuery, IReadOnlyList<BookManifestResponse>>
    {
        public async Task<IReadOnlyList<BookManifestResponse>> Handle(ListMyBooksQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var books = await bookRepository.ListForUserAsync(userId, cancellationToken);
            return books.Select(BookManifestResponse.From).ToList();
        }
    }
}
