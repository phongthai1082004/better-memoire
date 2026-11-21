using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record ReorderBookPagesCommand(Guid BookId, IReadOnlyList<string> PageIds) : ICommand<BookManifestResponse>;

    public class ReorderBookPagesCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : ICommandHandler<ReorderBookPagesCommand, BookManifestResponse>
    {
        public async Task<BookManifestResponse> Handle(ReorderBookPagesCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            if (!book.ReorderPages(request.PageIds)) throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
            await bookRepository.SaveChangesAsync(cancellationToken);
            return BookManifestResponse.From(book);
        }
    }
}
