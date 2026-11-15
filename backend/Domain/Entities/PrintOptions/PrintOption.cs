using Domain.Abstractions.Entities;
using Domain.Enums.Products;

namespace Domain.Entities.PrintOptions
{
    /// <summary>
    /// Print catalog option (cover, paper or size). Name/description are localized JSON
    /// (<c>{ "vi": ..., "en": ..., "es": ... }</c>) stored as jsonb. Soft-deleted because
    /// cart and order lines reference it.
    /// </summary>
    public class PrintOption : SoftDeleteAggregateRoot
    {
        public PrintOptionType Type { get; private set; }
        public string Code { get; private set; } = string.Empty;
        public string Name { get; private set; } = "{}";
        public string Description { get; private set; } = "{}";
        public int? Width { get; private set; }
        public int? Height { get; private set; }
        public int? Price { get; private set; }
        public int? PricePerPage { get; private set; }

        private PrintOption()
        {
        }

        public PrintOption(
            PrintOptionType type,
            string code,
            string name,
            string description,
            int? width = null,
            int? height = null,
            int? price = null,
            int? pricePerPage = null)
        {
            Type = type;
            Code = code;
            Name = name;
            Description = description;
            Width = width;
            Height = height;
            Price = price;
            PricePerPage = pricePerPage;
        }

        public void Update(
            string code,
            string name,
            string description,
            int? width,
            int? height,
            int? price,
            int? pricePerPage)
        {
            Code = code;
            Name = name;
            Description = description;
            Width = width;
            Height = height;
            Price = price;
            PricePerPage = pricePerPage;
        }
    }
}
