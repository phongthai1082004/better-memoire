using System.Text.Json;
using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Features.Books.Services;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Books;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record PatchBookPageCommand(Guid BookId, string PageId, int BaseVersion, Guid ClientMutationId, IReadOnlyList<PagePatchOperation> Operations, ElementDelta? ElementDelta) : ICommand<BookPageResponse>;

    public class PatchBookPageCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : ICommandHandler<PatchBookPageCommand, BookPageResponse>
    {
        public async Task<BookPageResponse> Handle(PatchBookPageCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var duplicate = await bookRepository.FindEventAsync(request.PageId, request.ClientMutationId, cancellationToken);

            if (duplicate is not null)
            {
                var existingBook = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);

                var existingPage = existingBook.Pages
                    .FirstOrDefault(page => page.Id == request.PageId)
                    ?? throw new NotFoundException(ErrorCode.BookPageNotFound);

                return BookPageResponse.From(existingPage);
            }

            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);

            var page = book.Pages.FirstOrDefault(item => item.Id == request.PageId)
                       ?? throw new NotFoundException(ErrorCode.BookPageNotFound);

            if (page.Version != request.BaseVersion)
                throw new ConflictException(ErrorCode.BookPageVersionConflict);

            var content = PageDocumentPatcher.Apply(page.Content, request.Operations);
            if (request.ElementDelta is { } elementDelta)
                content = PageDocumentPatcher.ApplyElementDelta(content, elementDelta);
            page.Update(page.Position, content);

            var pageEvent = new BookPageEvent(book.Id, page.Id, userId, book.NextEventSeq(), "page.patch.applied", request.BaseVersion, page.Version, request.ClientMutationId, JsonSerializer.Serialize(request.Operations))
            {
                CreatedOnUtc = DateTimeOffset.UtcNow
            };

            bookRepository.InsertEvent(pageEvent);
            await bookRepository.SaveChangesAsync(cancellationToken);

            return BookPageResponse.From(page);
        }
    }
}
