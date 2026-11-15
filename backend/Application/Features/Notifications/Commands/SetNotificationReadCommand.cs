using Application.CQRS;
using Application.Features.Notifications.Responses;

namespace Application.Features.Notifications.Commands
{
    public record SetNotificationReadCommand(Guid Id, bool IsRead) : ICommand<NotificationReadResponse>;
}
