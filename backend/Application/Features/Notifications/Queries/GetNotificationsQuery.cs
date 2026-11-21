using Application.CQRS;
using Application.Features.Notifications.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Notifications.Queries
{
    public record GetNotificationsQuery(int Limit) : IQuery<NotificationListResponse>;

    public class GetNotificationsQueryHandler(INotificationRepository notificationRepository, ICurrentUserService currentUser) : IQueryHandler<GetNotificationsQuery, NotificationListResponse>
    {
        public async Task<NotificationListResponse> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId ?? throw new UnauthorizedException(ErrorCode.AuthRequired);
            var limit = Math.Clamp(request.Limit, 1, 50);
            var items = await notificationRepository.GetForUserAsync(userId, limit, cancellationToken);
            var unread = await notificationRepository.CountUnreadAsync(userId, cancellationToken);
            return new NotificationListResponse(items.Select(NotificationResponse.From).ToList(), unread);
        }
    }
}
