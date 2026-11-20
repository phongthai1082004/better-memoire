using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Books;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record CreateBookCommand(string Title, string Type, string Style, string Font, string Cover, string? CoverUrl, double? PaperHeight, double? PaperWidth, Guid? SampleBookId) : ICommand<BookManifestResponse>;

    public class CreateBookCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : ICommandHandler<CreateBookCommand, BookManifestResponse>
    {
        private const string EmptyPage =
            """{"schemaVersion":2,"background":"#f3f2ea","elements":[]}""";

        public async Task<BookManifestResponse> Handle(CreateBookCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var book = new Book(userId, request.Title.Trim(), request.Type.Trim(), request.Style.Trim(), request.Font.Trim(), request.Cover.Trim(), request.SampleBookId, request.CoverUrl, request.PaperHeight, request.PaperWidth);

            book.AddPage(Guid.NewGuid().ToString("N"), 0, EmptyPage);
            book.AddPage(Guid.NewGuid().ToString("N"), 1, EmptyPage);
            bookRepository.Insert(book);

            foreach (var page in book.Pages)
            {
                var pageEvent = new BookPageEvent(book.Id, page.Id, userId, book.NextEventSeq(), "page.created", 0, page.Version, null, null)
                {
                    CreatedOnUtc = DateTimeOffset.UtcNow
                };

                bookRepository.InsertEvent(pageEvent);
            }

            await bookRepository.SaveChangesAsync(cancellationToken);

            return BookManifestResponse.From(book);
        }
    }
}
