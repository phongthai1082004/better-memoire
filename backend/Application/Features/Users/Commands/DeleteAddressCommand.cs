using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Users.Commands
{
    public record DeleteAddressCommand(int Id) : ICommand<MessageResponse>;
}
