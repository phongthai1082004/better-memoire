using Domain.Abstractions.Entities;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Suppliers
{
    /// <summary>
    /// Printing supplier. Soft-deleted because orders and expenses reference it; debt is
    /// computed from unpaid supplier expenses rather than cached on the row.
    /// </summary>
    public class Supplier : SoftDeleteAggregateRoot
    {
        private readonly List<SupplierPrintOption> _printOptions = [];

        public string Name { get; private set; } = string.Empty;
        public string Contact { get; private set; } = string.Empty;
        public string Email { get; private set; } = string.Empty;
        public string? TaxCode { get; private set; }
        public string? Address { get; private set; }
        public string? BankName { get; private set; }
        public string? BankBin { get; private set; }
        public string? BankAccountNumber { get; private set; }
        public string? BankAccountName { get; private set; }
        public string? ContactPerson { get; private set; }
        public int? PaymentTermDays { get; private set; }
        public int? LeadTimeDays { get; private set; }
        public bool Banned { get; private set; }
        public string? BannedReason { get; private set; }
        public DateTimeOffset? BannedAt { get; private set; }

        public IReadOnlyCollection<SupplierPrintOption> PrintOptions => _printOptions.AsReadOnly();

        private Supplier()
        {
        }

        public Supplier(string name, string contact, string email)
        {
            Name = name;
            Contact = contact;
            Email = email;
        }

        public void Update(string name, string contact, string email, string? taxCode, string? address, string? bankName, string? bankBin, string? bankAccountNumber, string? bankAccountName, string? contactPerson, int? paymentTermDays, int? leadTimeDays)
        {
            Name = name;
            Contact = contact;
            Email = email;
            TaxCode = taxCode;
            Address = address;
            BankName = bankName;
            BankBin = bankBin;
            BankAccountNumber = bankAccountNumber;
            BankAccountName = bankAccountName;
            ContactPerson = contactPerson;
            PaymentTermDays = paymentTermDays;
            LeadTimeDays = leadTimeDays;
        }

        public void Ban(string reason, DateTimeOffset at)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new DomainRuleException(ErrorCode.SupplierBanReasonRequired);

            Banned = true;
            BannedReason = reason;
            BannedAt = at;
        }

        public void Unban()
        {
            Banned = false;
            BannedReason = null;
            BannedAt = null;
        }

        public SupplierPrintOption AddPrintOption(Guid printOptionId, int costPrice, int costPerPage)
        {
            var existing = _printOptions.FirstOrDefault(o => o.PrintOptionId == printOptionId && !o.IsDeleted);
            if (existing is not null)
            {
                existing.UpdateCost(costPrice, costPerPage);
                return existing;
            }

            var option = new SupplierPrintOption(Id, printOptionId, costPrice, costPerPage);
            _printOptions.Add(option);
            return option;
        }

        public void RemovePrintOption(Guid printOptionId, DateTimeOffset at)
        {
            var option = _printOptions.FirstOrDefault(o => o.PrintOptionId == printOptionId && !o.IsDeleted);
            option?.SoftDelete(at);
        }
    }
}
