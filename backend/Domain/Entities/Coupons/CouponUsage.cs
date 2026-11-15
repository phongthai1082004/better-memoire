using Domain.Abstractions.Entities;

namespace Domain.Entities.Coupons
{
    /// <summary>
    /// Immutable coupon redemption record. <see cref="ReleasedAt"/> marks a usage released by
    /// a cancellation, but the row stays for audit.
    /// </summary>
    public class CouponUsage : BaseEntity<int>, IImmutableEntity
    {
        public Guid CouponId { get; private set; }
        public Guid UserId { get; private set; }
        public Guid OrderId { get; private set; }
        public int DiscountAmount { get; private set; }
        public DateTimeOffset UsedAt { get; private set; }
        public DateTimeOffset? ReleasedAt { get; private set; }

        private CouponUsage()
        {
        }

        public CouponUsage(Guid couponId, Guid userId, Guid orderId, int discountAmount, DateTimeOffset usedAt)
        {
            CouponId = couponId;
            UserId = userId;
            OrderId = orderId;
            DiscountAmount = discountAmount;
            UsedAt = usedAt;
        }

        public void Release(DateTimeOffset at) => ReleasedAt = at;
    }
}
