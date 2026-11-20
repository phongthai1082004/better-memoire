using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Resources;
using Microsoft.Extensions.Localization;

namespace Application.Features.Users.Commands
{
    public class DeleteAddressCommandHandler(IAddressRepository addressRepository, ICurrentUserService currentUser, IStringLocalizer<Message> localizer) : ICommandHandler<DeleteAddressCommand, MessageResponse>
    {
        public async Task<MessageResponse> Handle(DeleteAddressCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var address = await addressRepository.GetOwnedAsync(request.Id, userId, cancellationToken)
                          ?? throw new NotFoundException(ErrorCode.AddressNotFound);

            addressRepository.Delete(address);
            return new MessageResponse(localizer["Address.Deleted"]);
        }
    }
}
