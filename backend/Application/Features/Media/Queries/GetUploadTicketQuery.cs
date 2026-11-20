using Application.CQRS;
using Application.Features.Media.Responses;
using Application.Interfaces.Services;
using Domain.Enums.Media;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Media.Queries
{
    public record GetUploadTicketQuery(UploadKind Kind) : IQuery<UploadTicketResponse>;

    public class GetUploadTicketQueryHandler(IStorageService storage, ICurrentUserService currentUser) : IQueryHandler<GetUploadTicketQuery, UploadTicketResponse>
    {
        public async Task<UploadTicketResponse> Handle(GetUploadTicketQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var folder = request.Kind switch
            {
                UploadKind.Avatar => $"echotrace/bettermemoire/avatars/user_{userId}",
                UploadKind.BookThumb => $"echotrace/bettermemoire/book-thumbs/user_{userId}",
                _ => $"echotrace/bettermemoire/gallery/user_{userId}"
            };

            var ticket = await storage.CreateUploadTicketAsync(folder, cancellationToken);
            return new UploadTicketResponse(ticket.UploadUrl, ticket.Token, ticket.Folder, ticket.Expiry);
        }
    }
}
