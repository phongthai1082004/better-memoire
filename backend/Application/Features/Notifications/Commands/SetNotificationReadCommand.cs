using Application.CQRS;
using Application.Features.Notifications.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Notifications.Commands
{
    public record SetNotificationReadCommand(Guid Id, bool IsRead) : ICommand<NotificationReadResponse>;

    public class SetNotificationReadCommandHandler(INotificationRepository notificationRepository, ICurrentUserService currentUser)
            : ICommandHandler<SetNotificationReadCommand, NotificationReadResponse>
    {
        public async Task<NotificationReadResponse> Handle(SetNotificationReadCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var notification = await notificationRepository.GetByIdForUserAsync(request.Id, userId, cancellationToken) ?? throw new NotFoundException(ErrorCode.NotificationNotFound);

            if (request.IsRead)
                notification.MarkAsRead();
            else
                notification.MarkAsUnread();

            return new NotificationReadResponse(notification.Id, notification.IsRead, notification.ReadAt);
        }
    }
}
