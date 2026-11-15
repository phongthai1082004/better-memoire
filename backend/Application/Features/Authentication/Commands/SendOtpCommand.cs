using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Authentication.Commands
{
    public record SendOtpCommand(string Email) : ICommand<MessageResponse>;
}
