using Domain.Abstractions.Entities;
using Domain.Enums.Orders;

namespace Domain.Entities.Orders
{
    /// <summary>
    /// Append-only order status audit entry. Never deleted.
    /// </summary>
    public class OrderStatusHistory : BaseEntity<int>, IImmutableEntity
    {
        public Guid OrderId { get; private set; }
        public OrderStatus? FromStatus { get; private set; }
        public OrderStatus ToStatus { get; private set; }
        public Guid? ChangedBy { get; private set; }
        public string? Note { get; private set; }

        private OrderStatusHistory()
        {
        }

        public OrderStatusHistory(Guid orderId, OrderStatus? fromStatus, OrderStatus toStatus, Guid? changedBy = null, string? note = null)
        {
            OrderId = orderId;
            FromStatus = fromStatus;
            ToStatus = toStatus;
            ChangedBy = changedBy;
            Note = note;
        }
    }
}
