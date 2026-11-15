using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Media.Commands
{
    public record DeleteUserImageCommand(Guid Id) : ICommand<MessageResponse>;
}
