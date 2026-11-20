using Domain.Abstractions.Entities;

namespace Domain.Entities.Users
{
    /// <summary>
    /// Append-only audit trail (BigInt identity key). Never updated or deleted.
    /// </summary>
    public class AuditLog : BaseEntity<long>, IImmutableEntity
    {
        public Guid? ActorId { get; private set; }
        public string Action { get; private set; } = string.Empty;
        public string Entity { get; private set; } = string.Empty;
        public string EntityId { get; private set; } = string.Empty;
        public string? Before { get; private set; }
        public string? After { get; private set; }
        public string? Ip { get; private set; }

        private AuditLog()
        {
        }

        public AuditLog(Guid? actorId, string action, string entity, string entityId, string? before = null, string? after = null, string? ip = null)
        {
            ActorId = actorId;
            Action = action;
            Entity = entity;
            EntityId = entityId;
            Before = before;
            After = after;
            Ip = ip;
        }
    }
}
