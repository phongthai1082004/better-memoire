using Domain.Abstractions.Entities;

namespace Domain.Entities.Suppliers
{
    /// <summary>
    /// Supplier-specific cost for a catalog print option. Soft-deleted so historical
    /// reconciliation on past orders can still read the cost.
    /// </summary>
    public class SupplierPrintOption : BaseEntitySoftDelete<int>
    {
        public Guid SupplierId { get; private set; }
        public Guid PrintOptionId { get; private set; }
        public int CostPrice { get; private set; }
        public int CostPerPage { get; private set; }

        private SupplierPrintOption()
        {
        }

        public SupplierPrintOption(Guid supplierId, Guid printOptionId, int costPrice, int costPerPage)
        {
            if (costPrice < 0) throw new ArgumentOutOfRangeException(nameof(costPrice));
            if (costPerPage < 0) throw new ArgumentOutOfRangeException(nameof(costPerPage));

            SupplierId = supplierId;
            PrintOptionId = printOptionId;
            CostPrice = costPrice;
            CostPerPage = costPerPage;
        }

        public void UpdateCost(int costPrice, int costPerPage)
        {
            if (costPrice < 0) throw new ArgumentOutOfRangeException(nameof(costPrice));
            if (costPerPage < 0) throw new ArgumentOutOfRangeException(nameof(costPerPage));

            CostPrice = costPrice;
            CostPerPage = costPerPage;
        }

        public void SoftDelete(DateTimeOffset? at = null)
        {
            if (IsDeleted)
                return;

            IsDeleted = true;
            DeletedOnUtc = at ?? DateTimeOffset.UtcNow;
        }
    }
}
