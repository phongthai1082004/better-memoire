using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record DeleteBookPageCommand(Guid BookId, string PageId) : ICommand<BookManifestResponse>;

    public class DeleteBookPageCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : ICommandHandler<DeleteBookPageCommand, BookManifestResponse>
    {
        public async Task<BookManifestResponse> Handle(DeleteBookPageCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            if (book.Pages.Count <= 1) throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
            var page = book.Pages.FirstOrDefault(item => item.Id == request.PageId) ?? throw new NotFoundException(ErrorCode.BookPageNotFound);
            if (!book.RemovePage(page.Id)) throw new NotFoundException(ErrorCode.BookPageNotFound);
            bookRepository.DeletePage(page);
            var pageEvent = new Domain.Entities.Books.BookPageEvent(book.Id, page.Id, userId, book.NextEventSeq(), "page.deleted", page.Version, 0, null, null) { CreatedOnUtc = DateTimeOffset.UtcNow };
            bookRepository.InsertEvent(pageEvent);
            await bookRepository.SaveChangesAsync(cancellationToken);
            return BookManifestResponse.From(book);
        }
    }
}
