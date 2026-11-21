using Application.CQRS;
using Application.Features.Books.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Commands
{
    public record UpdateBookTitleCommand(Guid BookId, string Title) : ICommand<BookManifestResponse>;

    public class UpdateBookTitleCommandHandler(IBookRepository bookRepository, ICurrentUserService currentUser) : ICommandHandler<UpdateBookTitleCommand, BookManifestResponse>
    {
        public async Task<BookManifestResponse> Handle(UpdateBookTitleCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var book = await bookRepository.GetOwnedAsync(request.BookId, userId, includePages: true, cancellationToken) ?? throw new NotFoundException(ErrorCode.BookNotFound);
            book.UpdateTitle(request.Title.Trim());
            await bookRepository.SaveChangesAsync(cancellationToken);
            return BookManifestResponse.From(book);
        }
    }
}
