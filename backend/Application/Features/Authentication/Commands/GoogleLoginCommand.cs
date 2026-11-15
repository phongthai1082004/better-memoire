using Application.CQRS;
using Application.Features.Authentication.Responses;

namespace Application.Features.Authentication.Commands
{
    public record GoogleLoginCommand(string IdToken) : ICommand<AuthResponse>;
}
