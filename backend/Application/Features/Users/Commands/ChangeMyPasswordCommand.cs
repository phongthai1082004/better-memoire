using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Users.Commands
{
    public record ChangeMyPasswordCommand(string? CurrentPassword, string NewPassword)
        : ICommand<MessageResponse>;
}
