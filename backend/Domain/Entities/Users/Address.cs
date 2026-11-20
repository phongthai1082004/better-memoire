using Domain.Abstractions.Entities;

namespace Domain.Entities.Users
{
    /// <summary>
    /// Address-book entry owned by a user. Soft-deleted because order snapshots still
    /// reference the historical address data.
    /// </summary>
    public class Address : BaseEntitySoftDelete<int>
    {
        public Guid UserId { get; private set; }
        public string RecipientName { get; private set; } = string.Empty;
        public string Phone { get; private set; } = string.Empty;
        public string Province { get; private set; } = string.Empty;
        public string District { get; private set; } = string.Empty;
        public string Ward { get; private set; } = string.Empty;
        public string Street { get; private set; } = string.Empty;
        public bool IsDefault { get; private set; }

        private Address()
        {
        }

        public Address(Guid userId, string recipientName, string phone, string province, string district, string ward, string street, bool isDefault = false)
        {
            UserId = userId;
            RecipientName = recipientName;
            Phone = phone;
            Province = province;
            District = district;
            Ward = ward;
            Street = street;
            IsDefault = isDefault;
        }

        public void Update(string recipientName, string phone, string province, string district, string ward, string street)
        {
            RecipientName = recipientName;
            Phone = phone;
            Province = province;
            District = district;
            Ward = ward;
            Street = street;
        }

        public void SetDefault() => IsDefault = true;

        public void UnsetDefault() => IsDefault = false;

        public void SoftDelete(DateTimeOffset? at = null)
        {
            if (IsDeleted)
                return;

            IsDeleted = true;
            DeletedOnUtc = at ?? DateTimeOffset.UtcNow;
            IsDefault = false;
        }
    }
}
