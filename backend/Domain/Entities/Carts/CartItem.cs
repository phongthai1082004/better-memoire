using Domain.Abstractions.Entities;

namespace Domain.Entities.Carts
{
    /// <summary>
    /// Book line inside a cart. Hard-deleted on checkout or when the user removes it.
    /// </summary>
    public class CartItem : BaseEntity<int>
    {
        public const int MinQuantity = 1;
        public const int MaxQuantity = 999;

        public Guid CartId { get; private set; }
        public Guid BookId { get; private set; }
        public int Quantity { get; private set; }
        public Guid? CoverOptionId { get; private set; }
        public Guid? PaperOptionId { get; private set; }
        public Guid? SizeOptionId { get; private set; }

        private CartItem()
        {
        }

        public CartItem(Guid cartId, Guid bookId, int quantity, Guid? coverOptionId = null, Guid? paperOptionId = null, Guid? sizeOptionId = null)
        {
            CartId = cartId;
            BookId = bookId;
            Quantity = ClampQuantity(quantity);
            CoverOptionId = coverOptionId;
            PaperOptionId = paperOptionId;
            SizeOptionId = sizeOptionId;
        }

        public void SetQuantity(int quantity) => Quantity = ClampQuantity(quantity);

        public void UpdateOptions(Guid? coverOptionId, Guid? paperOptionId, Guid? sizeOptionId)
        {
            CoverOptionId = coverOptionId;
            PaperOptionId = paperOptionId;
            SizeOptionId = sizeOptionId;
        }

        public static int ClampQuantity(int quantity) => Math.Clamp(quantity, MinQuantity, MaxQuantity);
    }
}
