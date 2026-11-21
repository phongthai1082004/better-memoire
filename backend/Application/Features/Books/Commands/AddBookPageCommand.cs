using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Books;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record AddBookPageCommand(Guid BookId) : ICommand<BookPageResponse>;

    public class AddBookPageCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser)
        : ICommandHandler<AddBookPageCommand, BookPageResponse>
    {
        private const string EmptyPage = """{"schemaVersion":2,"background":"#f3f2ea","elements":[]}""";

        public async Task<BookPageResponse> Handle(AddBookPageCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            var page = book.AddPage(Guid.NewGuid().ToString("N"), book.Pages.Count, EmptyPage);
            var pageEvent = new BookPageEvent(book.Id, page.Id, userId, book.NextEventSeq(), "page.created", 0, page.Version, null, null)
            {
                CreatedOnUtc = DateTimeOffset.UtcNow
            };
            bookRepository.InsertEvent(pageEvent);
            await bookRepository.SaveChangesAsync(cancellationToken);

            return BookPageResponse.From(page);
        }
    }
}
