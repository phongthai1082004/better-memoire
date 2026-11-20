using Application.Features.Books.Responses;

namespace Application.Features.Books.Queries
{
    using Application.CQRS;
    using Application.Interfaces.Services;
    using Domain.Abstractions.Repository;
    using Domain.Errors;
    using Domain.Exceptions.Common;

    public record ListMyBooksQuery : IQuery<IReadOnlyList<BookManifestResponse>>;

    public class ListMyBooksQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser)
        : IQueryHandler<ListMyBooksQuery, IReadOnlyList<BookManifestResponse>>
    {
        public async Task<IReadOnlyList<BookManifestResponse>> Handle(ListMyBooksQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var books = await bookRepository.ListForUserAsync(userId, cancellationToken);
            return books.Select(BookManifestResponse.From).ToList();
        }
    }

    public record GetBookManifestQuery(Guid BookId) : IQuery<BookManifestResponse>;

    public class GetBookManifestQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser)
        : IQueryHandler<GetBookManifestQuery, BookManifestResponse>
    {
        public async Task<BookManifestResponse> Handle(GetBookManifestQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);

            return BookManifestResponse.From(book);
        }
    }

    public record GetBookPageWindowQuery(Guid BookId, int From, int To)
        : IQuery<IReadOnlyList<BookPageResponse>>;

    public class GetBookPageWindowQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser)
        : IQueryHandler<GetBookPageWindowQuery, IReadOnlyList<BookPageResponse>>
    {
        public async Task<IReadOnlyList<BookPageResponse>> Handle(GetBookPageWindowQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: false, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);

            var from = Math.Max(0, request.From);
            var to = Math.Clamp(request.To, from, from + 6);

            var pages = await bookRepository.GetPageWindowAsync(book.Id, from, to, cancellationToken);

            return pages.Select(BookPageResponse.From).ToList();
        }
    }
}
