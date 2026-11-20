using Domain.Abstractions.Entities;
using Domain.Enums.Notifications;

namespace Domain.Entities.Notifications
{
    /// <summary>
    /// Notification aggregate root. Soft-deleted so users can clear their inbox while
    /// admins keep the audit trail of what was sent.
    /// </summary>
    public class Notification : SoftDeleteAggregateRoot
    {
        public Guid UserId { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string Message { get; private set; } = string.Empty;
        public string SendBy { get; private set; } = "system";
        public NotificationType Type { get; private set; }
        public string[] Channels { get; private set; } = [];
        public string Scope { get; private set; } = "personal";
        public string? Email { get; private set; }
        public string? Phone { get; private set; }
        public string? Link { get; private set; }
        public string? Metadata { get; private set; }
        public string? I18n { get; private set; }
        public bool IsRead { get; private set; }
        public DateTimeOffset? ReadAt { get; private set; }

        private Notification()
        {
        }

        public Notification(Guid userId, string title, string message, NotificationType type, string[]? channels = null, string scope = "personal", string sendBy = "system", string? email = null, string? phone = null, string? link = null, string? metadata = null, string? i18n = null)
        {
            UserId = userId;
            Title = title;
            Message = message;
            Type = type;
            Channels = channels ?? ["db"];
            Scope = scope;
            SendBy = sendBy;
            Email = email;
            Phone = phone;
            Link = link;
            Metadata = metadata;
            I18n = i18n;
        }

        public void MarkAsRead(DateTimeOffset? at = null)
        {
            IsRead = true;
            ReadAt = at ?? DateTimeOffset.UtcNow;
        }

        public void MarkAsUnread()
        {
            IsRead = false;
            ReadAt = null;
        }
    }
}
