using Domain.Abstractions.Entities;
using Domain.Enums.Ops;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Ops
{
    /// <summary>
    /// Maintenance window. Never deleted; the history of maintenance events is kept.
    /// An active window may have a null <see cref="EndAt"/> (manual toggle).
    /// </summary>
    public class MaintenanceWindow : AggregateRoot, IImmutableEntity
    {
        private static readonly TimeSpan MaxScheduledDuration = TimeSpan.FromHours(24);

        public DateTimeOffset StartAt { get; private set; }
        public DateTimeOffset? EndAt { get; private set; }
        public string? Reason { get; private set; }
        public MaintenanceStatus Status { get; private set; } = MaintenanceStatus.Scheduled;
        public Guid? EndedBy { get; private set; }
        public DateTimeOffset? EndedAt { get; private set; }
        public DateTimeOffset? NotifiedAt { get; private set; }

        private MaintenanceWindow()
        {
        }

        public MaintenanceWindow(DateTimeOffset startAt, DateTimeOffset? endAt, string? reason)
        {
            if (endAt.HasValue)
            {
                if (endAt <= startAt)
                    throw new DomainRuleException(ErrorCode.MaintenanceEndAfterStart);

                if (endAt.Value - startAt > MaxScheduledDuration)
                    throw new DomainRuleException(ErrorCode.MaintenanceTooLong);
            }

            StartAt = startAt;
            EndAt = endAt;
            Reason = reason;
        }

        public static MaintenanceWindow StartNow(DateTimeOffset at, string? reason = null)
            => new(at, null, reason) { Status = MaintenanceStatus.Active };

        public bool IsLive(DateTimeOffset at) => StartAt <= at && (EndAt is null || EndAt >= at);

        public void Activate() => Status = MaintenanceStatus.Active;

        public void Complete(Guid? endedBy, DateTimeOffset at)
        {
            Status = MaintenanceStatus.Completed;
            EndedBy = endedBy;
            EndedAt = at;
            EndAt ??= at;
        }

        public void Cancel(Guid? endedBy, DateTimeOffset at)
        {
            Status = MaintenanceStatus.Cancelled;
            EndedBy = endedBy;
            EndedAt = at;
        }

        public void MarkNotified(DateTimeOffset at) => NotifiedAt = at;
    }
}
