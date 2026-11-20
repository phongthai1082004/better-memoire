using Domain.Abstractions.Entities;
using Domain.Enums.Orders;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Orders
{
    /// <summary>
    /// Order aggregate root. Never deleted: cancellation is a status change and the
    /// record is kept for financial, tax and dispute-resolution purposes.
    /// </summary>
    public class Order : AggregateRoot, IImmutableEntity
    {
        private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
        {
            [OrderStatus.PendingPayment] = [OrderStatus.DepositPaid, OrderStatus.Paid, OrderStatus.Cancelled],
            [OrderStatus.DepositPaid] = [OrderStatus.Paid, OrderStatus.Processing, OrderStatus.Cancelled],
            [OrderStatus.Paid] = [OrderStatus.Processing, OrderStatus.Cancelled],
            [OrderStatus.Processing] = [OrderStatus.Printing, OrderStatus.Shipping, OrderStatus.Cancelled],
            [OrderStatus.Printing] = [OrderStatus.Shipping, OrderStatus.Cancelled],
            [OrderStatus.Shipping] = [OrderStatus.Delivered, OrderStatus.Cancelled],
            [OrderStatus.Delivered] = [OrderStatus.Completed],
            [OrderStatus.Completed] = [],
            [OrderStatus.Cancelled] = []
        };

        private readonly List<OrderItem> _items = [];
        private readonly List<OrderStatusHistory> _statusHistory = [];

        public string? OrderCode { get; private set; }
        public Guid UserId { get; private set; }
        public Guid? SupplierId { get; private set; }
        public OrderStatus Status { get; private set; } = OrderStatus.PendingPayment;
        public PaymentType PaymentType { get; private set; }

        public int SubTotal { get; private set; }
        public int DiscountAmount { get; private set; }
        public int TotalAmount { get; private set; }
        public int? OrderShippingFee { get; private set; }
        public int? SupplierShippingFee { get; private set; }
        public int DepositAmount { get; private set; }
        public int PaidAmount { get; private set; }

        public string? Name { get; private set; }
        public string? Phone { get; private set; }
        public string? Province { get; private set; }
        public string? District { get; private set; }
        public string? Ward { get; private set; }
        public string? Address { get; private set; }

        public string? Carrier { get; private set; }
        public string? ShippingMethod { get; private set; }
        public string? TrackingCode { get; private set; }

        public string? SupplierOrderCode { get; private set; }
        public DateTimeOffset? SentToSupplierAt { get; private set; }

        public string? QrCode { get; private set; }
        public string? CheckoutUrl { get; private set; }
        public DateTimeOffset? PaymentExpiresAt { get; private set; }
        public DateTimeOffset? CodReconciledAt { get; private set; }

        public string? CustomerNote { get; private set; }
        public string? InternalNote { get; private set; }
        public string? CancelReason { get; private set; }

        public string? InvoiceCompany { get; private set; }
        public string? InvoiceTaxCode { get; private set; }
        public string? InvoiceEmail { get; private set; }

        public string? UtmSource { get; private set; }
        public string? UtmMedium { get; private set; }
        public string? UtmCampaign { get; private set; }

        public DateTimeOffset? PaidAt { get; private set; }
        public DateTimeOffset? ShippedAt { get; private set; }
        public DateTimeOffset? DeliveredAt { get; private set; }
        public DateTimeOffset? CompletedAt { get; private set; }
        public DateTimeOffset? CancelledAt { get; private set; }

        public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
        public IReadOnlyCollection<OrderStatusHistory> StatusHistory => _statusHistory.AsReadOnly();

        private Order()
        {
        }

        public Order(Guid userId, PaymentType paymentType, int subTotal, int discountAmount, int totalAmount, int depositAmount = 0)
        {
            UserId = userId;
            PaymentType = paymentType;
            SubTotal = subTotal;
            DiscountAmount = discountAmount;
            TotalAmount = totalAmount;
            DepositAmount = depositAmount;
        }

        public void SetOrderCode(string orderCode) => OrderCode = orderCode;

        public void UpdateTotals(int subTotal, int discountAmount, int totalAmount)
        {
            SubTotal = subTotal;
            DiscountAmount = discountAmount;
            TotalAmount = totalAmount;
        }

        public void SetShippingSnapshot(string? name, string? phone, string? province, string? district, string? ward, string? address)
        {
            Name = name;
            Phone = phone;
            Province = province;
            District = district;
            Ward = ward;
            Address = address;
        }

        public void SetShippingFees(int? orderShippingFee, int? supplierShippingFee)
        {
            OrderShippingFee = orderShippingFee;
            SupplierShippingFee = supplierShippingFee;
        }

        public void SetPaymentLink(string? qrCode, string? checkoutUrl, DateTimeOffset? expiresAt)
        {
            QrCode = qrCode;
            CheckoutUrl = checkoutUrl;
            PaymentExpiresAt = expiresAt;
        }

        public void SetNotes(string? customerNote, string? internalNote)
        {
            CustomerNote = customerNote;
            InternalNote = internalNote;
        }

        public void SetInvoice(string? company, string? taxCode, string? email)
        {
            InvoiceCompany = company;
            InvoiceTaxCode = taxCode;
            InvoiceEmail = email;
        }

        public void SetAttribution(string? source, string? medium, string? campaign)
        {
            UtmSource = source;
            UtmMedium = medium;
            UtmCampaign = campaign;
        }

        public OrderItem AddItem(OrderItem item)
        {
            item.AttachTo(Id);
            _items.Add(item);
            return item;
        }

        public void AssignSupplier(Guid supplierId, string? supplierOrderCode, DateTimeOffset at)
        {
            if (SupplierId.HasValue)
                throw new DomainRuleException(ErrorCode.OrderSupplierAlreadyAssigned);

            SupplierId = supplierId;
            SupplierOrderCode = supplierOrderCode;
            SentToSupplierAt = at;

            if (Status is OrderStatus.Paid or OrderStatus.DepositPaid)
                ChangeStatus(OrderStatus.Processing, null, "Supplier assigned");
        }

        /// <summary>Applies a payment. Returns true when the order becomes fully paid.</summary>
        public bool RecordPayment(int amount, DateTimeOffset at)
        {
            if (amount <= 0)
                throw new ArgumentOutOfRangeException(nameof(amount));

            PaidAmount += amount;

            if (PaidAmount >= TotalAmount)
            {
                if (Status is not OrderStatus.Paid)
                    ChangeStatus(OrderStatus.Paid, null, "Fully paid");
                PaidAt = at;
                return true;
            }

            if (Status == OrderStatus.PendingPayment)
                ChangeStatus(OrderStatus.DepositPaid, null, "Deposit paid");

            return false;
        }

        public void MarkPaid(DateTimeOffset at)
        {
            if (PaidAmount == 0)
                PaidAmount = TotalAmount;

            ChangeStatus(OrderStatus.Paid, null, "Paid");
            PaidAt = at;
        }

        public void MarkDepositPaid(DateTimeOffset at)
        {
            _ = at;
            ChangeStatus(OrderStatus.DepositPaid, null, "Deposit paid");
        }

        public void StartProcessing(Guid? changedBy = null, string? note = null)
            => ChangeStatus(OrderStatus.Processing, changedBy, note ?? "Processing");

        public void StartPrinting(Guid? changedBy = null, string? note = null)
            => ChangeStatus(OrderStatus.Printing, changedBy, note ?? "Printing");

        public void Ship(string? carrier, string? shippingMethod, string? trackingCode, DateTimeOffset at, Guid? changedBy = null)
        {
            Carrier = carrier;
            ShippingMethod = shippingMethod;
            TrackingCode = trackingCode;
            ShippedAt = at;
            ChangeStatus(OrderStatus.Shipping, changedBy, "Shipped");
        }

        public void Deliver(DateTimeOffset at, Guid? changedBy = null)
        {
            DeliveredAt = at;
            ChangeStatus(OrderStatus.Delivered, changedBy, "Delivered");
        }

        /// <summary>Completes the order; this is the revenue-recognition milestone.</summary>
        public void Complete(DateTimeOffset at, Guid? changedBy = null)
        {
            CompletedAt = at;
            ChangeStatus(OrderStatus.Completed, changedBy, "Completed");
        }

        public void Cancel(string? reason, DateTimeOffset at, Guid? changedBy = null)
        {
            CancelReason = reason;
            CancelledAt = at;
            ChangeStatus(OrderStatus.Cancelled, changedBy, reason ?? "Cancelled");
        }

        public void ReconcileCod(DateTimeOffset at) => CodReconciledAt = at;

        /// <summary>Force-sets a status bypassing the state machine. Audited via a note.</summary>
        public void ForceStatus(OrderStatus status, string reason, Guid? changedBy, DateTimeOffset at)
        {
            if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
                throw new DomainRuleException(ErrorCode.OrderForceReasonRequired);

            ChangeStatus(status, changedBy, $"[FORCE {at:O}] {reason}", enforceTransition: false);
        }

        public bool CanTransitionTo(OrderStatus status)
            => AllowedTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(status);

        private void ChangeStatus(OrderStatus status, Guid? changedBy, string? note, bool enforceTransition = true)
        {
            if (Status == status)
                return;

            if (enforceTransition && !CanTransitionTo(status))
                throw new DomainRuleException(ErrorCode.OrderInvalidTransition);

            var from = Status;
            Status = status;
            _statusHistory.Add(new OrderStatusHistory(Id, from, status, changedBy, note));
        }
    }
}
