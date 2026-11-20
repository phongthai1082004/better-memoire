using Domain.Abstractions.Entities;
using Domain.Enums.Orders;
using Domain.Enums.Products;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Orders
{
    /// <summary>
    /// Immutable order line. Holds the frozen book content, per-item PDF pipeline state and
    /// per-item return/defect state. Never deleted; refunds/reprints are state changes.
    /// </summary>
    public class OrderItem : BaseEntity<int>, IImmutableEntity
    {
        public Guid OrderId { get; private set; }
        public Guid? BookId { get; private set; }
        public string BookTitle { get; private set; } = string.Empty;
        public int PageCount { get; private set; }
        public int Quantity { get; private set; }
        public Guid? CoverOptionId { get; private set; }
        public Guid? PaperOptionId { get; private set; }
        public Guid? SizeOptionId { get; private set; }
        public int UnitPrice { get; private set; }
        public int UnitCost { get; private set; }
        public int LineTotal { get; private set; }

        public string ContentSnapshot { get; private set; } = "[]";
        public Guid[] ImageIds { get; private set; } = [];

        public PdfStatus PdfStatus { get; private set; } = PdfStatus.Pending;
        public string? PdfUrl { get; private set; }
        public int PdfAttempts { get; private set; }
        public string? PdfLastError { get; private set; }
        public DateTimeOffset? PdfLockedAt { get; private set; }
        public DateTimeOffset? PdfProcessedAt { get; private set; }

        public ReturnState ReturnState { get; private set; } = ReturnState.None;
        public ReturnFault? ReturnFault { get; private set; }
        public string? ReturnReason { get; private set; }
        public DefectState DefectState { get; private set; } = DefectState.None;
        public string? DefectNote { get; private set; }
        public string[] EvidenceUrls { get; private set; } = [];
        public int RefundAmount { get; private set; }
        public int? ReprintOfItemId { get; private set; }

        private OrderItem()
        {
        }

        public OrderItem(Guid bookId, string bookTitle, int pageCount, int quantity, int unitPrice, int unitCost, int lineTotal, string contentSnapshot, Guid[]? imageIds = null, Guid? coverOptionId = null, Guid? paperOptionId = null, Guid? sizeOptionId = null, int? reprintOfItemId = null)
        {
            BookId = bookId;
            BookTitle = bookTitle;
            PageCount = pageCount;
            Quantity = CartQuantity(quantity);
            UnitPrice = unitPrice;
            UnitCost = unitCost;
            LineTotal = lineTotal;
            ContentSnapshot = contentSnapshot;
            ImageIds = imageIds ?? [];
            CoverOptionId = coverOptionId;
            PaperOptionId = paperOptionId;
            SizeOptionId = sizeOptionId;
            ReprintOfItemId = reprintOfItemId;
        }

        public void AttachTo(Guid orderId) => OrderId = orderId;

        public void UpdateCost(int unitCost)
        {
            if (unitCost < 0)
                throw new ArgumentOutOfRangeException(nameof(unitCost));

            UnitCost = unitCost;
        }

        // PDF pipeline
        public void LockForPdf(DateTimeOffset at)
        {
            PdfStatus = PdfStatus.Processing;
            PdfAttempts++;
            PdfLockedAt = at;
            PdfLastError = null;
        }

        public void CompletePdf(string url, DateTimeOffset at)
        {
            PdfStatus = PdfStatus.Done;
            PdfUrl = url;
            PdfProcessedAt = at;
            PdfLockedAt = null;
            PdfLastError = null;
        }

        public void FailPdf(string error, DateTimeOffset at, int maxAttempts = 5)
        {
            PdfLastError = error.Length > 2000 ? error[..2000] : error;
            PdfLockedAt = null;
            PdfProcessedAt = at;
            PdfStatus = PdfAttempts >= maxAttempts ? PdfStatus.Failed : PdfStatus.Pending;
        }

        // Returns
        public void RequestReturn(string reason)
        {
            if (ReturnState != ReturnState.None)
                throw new DomainRuleException(ErrorCode.OrderReturnAlreadyRequested);

            ReturnState = ReturnState.Requested;
            ReturnReason = reason;
        }

        public void ApproveReturn(ReturnFault fault)
        {
            if (ReturnState != ReturnState.Requested)
                throw new DomainRuleException(ErrorCode.OrderReturnNotRequested);

            ReturnFault = fault;
            ReturnState = ReturnState.Reshipping;
        }

        public void MarkReshipped() => ReturnState = ReturnState.Reshipped;

        public void StartRefund() => ReturnState = ReturnState.Refunding;

        public void MarkRefunded(int amount)
        {
            if (amount < 0)
                throw new ArgumentOutOfRangeException(nameof(amount));

            RefundAmount = amount;
            ReturnState = ReturnState.Refunded;
        }

        // Defects
        public void ReportDefect(string? note, string[]? evidenceUrls = null)
        {
            if (DefectState != DefectState.None)
                throw new DomainRuleException(ErrorCode.OrderDefectAlreadyReported);

            DefectState = DefectState.Reported;
            DefectNote = note;
            EvidenceUrls = evidenceUrls ?? [];
        }

        public void ResolveDefect(string? note)
        {
            if (DefectState != DefectState.Reported)
                throw new DomainRuleException(ErrorCode.OrderDefectNotReported);

            DefectState = DefectState.Resolved;
            if (note is not null)
                DefectNote = note;
        }

        private static int CartQuantity(int quantity) => Math.Max(1, quantity);
    }
}
