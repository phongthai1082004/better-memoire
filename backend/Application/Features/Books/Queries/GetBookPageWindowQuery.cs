using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Queries
{
    public record GetBookPageWindowQuery(Guid BookId, int From, int To) : IQuery<IReadOnlyList<BookPageResponse>>;

    public class GetBookPageWindowQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : IQueryHandler<GetBookPageWindowQuery, IReadOnlyList<BookPageResponse>>
    {
        public async Task<IReadOnlyList<BookPageResponse>> Handle(GetBookPageWindowQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: false, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            var from = Math.Max(0, request.From);
            var to = Math.Clamp(request.To, from, from + 6);
            var pages = await bookRepository.GetPageWindowAsync(book.Id, from, to, cancellationToken);
            return pages.Select(BookPageResponse.From).ToList();
        }
    }
}
