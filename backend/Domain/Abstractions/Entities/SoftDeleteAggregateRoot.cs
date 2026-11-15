using Domain.Abstractions.Events;

namespace Domain.Abstractions.Entities
{
    /// <summary>
    /// Aggregate root that is recoverable: <c>IsDeleted</c> + <c>DeletedOnUtc</c>
    /// and a global EF query filter hide it instead of deleting the row.
    /// </summary>
    public abstract class SoftDeleteAggregateRoot : GuidEntitySoftDelete, IAggregate
    {
        private readonly List<IDomainEvent> _domainEvents = [];

        public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

        public void AddDomainEvent(IDomainEvent domainEvent)
        {
            _domainEvents.Add(domainEvent);
        }

        public IDomainEvent[] ClearDomainEvents()
        {
            IDomainEvent[] dequeuedEvents = [.. _domainEvents];
            _domainEvents.Clear();
            return dequeuedEvents;
        }
    }
}
