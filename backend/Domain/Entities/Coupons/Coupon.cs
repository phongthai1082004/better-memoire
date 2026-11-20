using Domain.Abstractions.Entities;
using Domain.Enums.Coupons;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Coupons
{
    /// <summary>
    /// Coupon aggregate root. Soft-deleted because <see cref="CouponUsage"/> rows keep
    /// referencing it for usage history.
    /// </summary>
    public class Coupon : SoftDeleteAggregateRoot
    {
        private readonly List<CouponUsage> _usages = [];

        public string Code { get; private set; } = string.Empty;
        public string? Description { get; private set; }
        public DiscountType DiscountType { get; private set; }
        public int DiscountValue { get; private set; }
        public int MinOrderAmount { get; private set; }
        public MinOrderType MinOrderType { get; private set; }
        public int? MaxDiscountAmount { get; private set; }
        public int MaxUsageCount { get; private set; }
        public int MaxUsagePerUser { get; private set; }
        public int UsedCount { get; private set; }
        public bool FirstOrderOnly { get; private set; }
        public bool IsActive { get; private set; } = true;
        public DateTimeOffset? StartsAt { get; private set; }
        public DateTimeOffset? ExpiresAt { get; private set; }

        public IReadOnlyCollection<CouponUsage> Usages => _usages.AsReadOnly();

        private Coupon()
        {
        }

        public Coupon(string code, DiscountType discountType, int discountValue, int minOrderAmount = 0, MinOrderType minOrderType = MinOrderType.Value, int? maxDiscountAmount = null, int maxUsageCount = 0, int maxUsagePerUser = 0, bool firstOrderOnly = false, DateTimeOffset? startsAt = null, DateTimeOffset? expiresAt = null, string? description = null)
        {
            Code = code;
            DiscountType = discountType;
            DiscountValue = discountValue;
            MinOrderAmount = minOrderAmount;
            MinOrderType = minOrderType;
            MaxDiscountAmount = maxDiscountAmount;
            MaxUsageCount = maxUsageCount;
            MaxUsagePerUser = maxUsagePerUser;
            FirstOrderOnly = firstOrderOnly;
            StartsAt = startsAt;
            ExpiresAt = expiresAt;
            Description = description;
        }

        public bool IsUsable(DateTimeOffset now)
            => IsActive
               && !IsDeleted
               && (StartsAt is null || StartsAt <= now)
               && (ExpiresAt is null || ExpiresAt >= now)
               && (MaxUsageCount == 0 || UsedCount < MaxUsageCount);

        /// <summary>
        /// Mirrors the shared BE/FE discount formula. Returns 0 when the coupon cannot apply.
        /// </summary>
        public int CalculateDiscount(int subTotal, int totalQuantity, DateTimeOffset now)
        {
            if (!IsUsable(now))
                return 0;

            var meetsMinimum = MinOrderType == MinOrderType.Quantity
                ? totalQuantity >= MinOrderAmount
                : subTotal >= MinOrderAmount;

            if (!meetsMinimum)
                return 0;

            var raw = DiscountType == DiscountType.Percentage
                ? (int)Math.Round(subTotal * DiscountValue / 100d, MidpointRounding.AwayFromZero)
                : DiscountValue;

            if (MaxDiscountAmount.HasValue)
                raw = Math.Min(raw, MaxDiscountAmount.Value);

            return Math.Clamp(raw, 0, subTotal);
        }

        public void RecordUsage()
        {
            if (MaxUsageCount > 0 && UsedCount >= MaxUsageCount)
                throw new DomainRuleException(ErrorCode.CouponUsageLimitReached);

            UsedCount++;
        }

        public void ReleaseUsage()
        {
            if (UsedCount > 0)
                UsedCount--;
        }

        public void Deactivate() => IsActive = false;

        public void Activate() => IsActive = true;

        public void Update(string code, DiscountType discountType, int discountValue, int minOrderAmount, MinOrderType minOrderType, int? maxDiscountAmount, int maxUsageCount, int maxUsagePerUser, bool firstOrderOnly, DateTimeOffset? startsAt, DateTimeOffset? expiresAt, string? description)
        {
            Code = code;
            DiscountType = discountType;
            DiscountValue = discountValue;
            MinOrderAmount = minOrderAmount;
            MinOrderType = minOrderType;
            MaxDiscountAmount = maxDiscountAmount;
            MaxUsageCount = maxUsageCount;
            MaxUsagePerUser = maxUsagePerUser;
            FirstOrderOnly = firstOrderOnly;
            StartsAt = startsAt;
            ExpiresAt = expiresAt;
            Description = description;
        }
    }
}
