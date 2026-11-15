using Application.CQRS;
using Application.Features.Users.Responses;

namespace Application.Features.Users.Commands
{
    public record UpdateAddressCommand(
        int Id,
        string RecipientName,
        string Phone,
        string Province,
        string District,
        string Ward,
        string Street,
        bool IsDefault) : ICommand<AddressResponse>;
}
