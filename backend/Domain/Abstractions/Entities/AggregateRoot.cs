using Domain.Abstractions.Events;

namespace Domain.Abstractions.Entities
{
    /// <summary>
    /// Base class for an aggregate root with a <see cref="Guid"/> key.
    /// Aggregates buffer domain events until the persistence layer dispatches them.
    /// Delete policy is deliberately not part of the aggregate: immutable aggregates
    /// (Order, Cart, Transaction, ...) derive directly from this class, while
    /// recoverable aggregates derive from <see cref="SoftDeleteAggregateRoot"/>.
    /// </summary>
    public abstract class AggregateRoot : GuidEntity, IAggregate
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
