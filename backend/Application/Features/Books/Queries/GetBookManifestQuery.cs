using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Queries
{
    public record GetBookManifestQuery(Guid BookId) : IQuery<BookManifestResponse>;

    public class GetBookManifestQueryHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : IQueryHandler<GetBookManifestQuery, BookManifestResponse>
    {
        public async Task<BookManifestResponse> Handle(GetBookManifestQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            return BookManifestResponse.From(book);
        }
    }
}
