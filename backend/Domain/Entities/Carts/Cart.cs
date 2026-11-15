using Domain.Abstractions.Entities;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Carts
{
    /// <summary>
    /// Cart aggregate root. One per user, created on first add-to-cart and never deleted.
    /// </summary>
    public class Cart : AggregateRoot, IImmutableEntity
    {
        private readonly List<CartItem> _items = [];

        public Guid UserId { get; private set; }
        public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;

        public IReadOnlyCollection<CartItem> Items => _items.AsReadOnly();

        private Cart()
        {
        }

        public Cart(Guid userId)
        {
            UserId = userId;
        }

        public CartItem AddItem(
            Guid bookId,
            int quantity,
            Guid? coverOptionId = null,
            Guid? paperOptionId = null,
            Guid? sizeOptionId = null)
        {
            quantity = CartItem.ClampQuantity(quantity);

            var existing = _items.FirstOrDefault(i => i.BookId == bookId);
            if (existing is not null)
            {
                existing.SetQuantity(CartItem.ClampQuantity(existing.Quantity + quantity));
                existing.UpdateOptions(coverOptionId ?? existing.CoverOptionId, paperOptionId ?? existing.PaperOptionId, sizeOptionId ?? existing.SizeOptionId);
                Touch();
                return existing;
            }

            var item = new CartItem(Id, bookId, quantity, coverOptionId, paperOptionId, sizeOptionId);
            _items.Add(item);
            Touch();
            return item;
        }

        public CartItem UpdateItem(
            Guid bookId,
            int quantity,
            Guid? coverOptionId,
            Guid? paperOptionId,
            Guid? sizeOptionId)
        {
            var item = _items.FirstOrDefault(i => i.BookId == bookId)
                ?? throw new DomainRuleException(ErrorCode.CartBookNotFound);

            item.SetQuantity(quantity);
            item.UpdateOptions(coverOptionId, paperOptionId, sizeOptionId);
            Touch();
            return item;
        }

        public bool RemoveItem(Guid bookId)
        {
            var item = _items.FirstOrDefault(i => i.BookId == bookId);
            if (item is null)
                return false;

            _items.Remove(item);
            Touch();
            return true;
        }

        public void Clear()
        {
            _items.Clear();
            Touch();
        }

        public int TotalQuantity() => _items.Sum(i => i.Quantity);

        private void Touch() => UpdatedAt = DateTimeOffset.UtcNow;
    }
}
