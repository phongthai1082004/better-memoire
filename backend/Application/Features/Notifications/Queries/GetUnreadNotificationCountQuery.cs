using Application.CQRS;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Notifications.Queries
{
    public record GetUnreadNotificationCountQuery : IQuery<int>;

    public class GetUnreadNotificationCountQueryHandler(INotificationRepository notificationRepository, ICurrentUserService currentUser) : IQueryHandler<GetUnreadNotificationCountQuery, int>
    {
        public async Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            return await notificationRepository.CountUnreadAsync(userId, cancellationToken);
        }
    }
}
