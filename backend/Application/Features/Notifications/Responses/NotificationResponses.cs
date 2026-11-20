using Domain.Entities.Notifications;
using Domain.Enums.Notifications;

namespace Application.Features.Notifications.Responses
{
    public record NotificationResponse(Guid Id, string Title, string Message, NotificationType Type, string SendBy, string[] Channels, string Scope, string? Link, string? Metadata, string? I18n, bool IsRead, DateTimeOffset? ReadAt, DateTimeOffset CreatedOnUtc)
    {
        public static NotificationResponse From(Notification notification) => new(notification.Id, notification.Title, notification.Message, notification.Type, notification.SendBy, notification.Channels, notification.Scope, notification.Link, notification.Metadata, notification.I18n, notification.IsRead, notification.ReadAt, notification.CreatedOnUtc);
    }

    public record NotificationListResponse(IReadOnlyList<NotificationResponse> Items, int UnreadCount);

    public record NotificationReadResponse(Guid Id, bool IsRead, DateTimeOffset? ReadAt);
}
