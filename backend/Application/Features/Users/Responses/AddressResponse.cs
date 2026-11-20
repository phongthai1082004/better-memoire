using Domain.Entities.Users;

namespace Application.Features.Users.Responses
{
    public record AddressResponse(int Id, string RecipientName, string Phone, string Province, string District, string Ward, string Street, bool IsDefault)
    {
        public static AddressResponse From(Address address) => new(address.Id, address.RecipientName, address.Phone, address.Province, address.District, address.Ward, address.Street, address.IsDefault);
    }
}
