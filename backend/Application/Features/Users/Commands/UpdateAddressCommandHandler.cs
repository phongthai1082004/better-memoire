using Application.CQRS;
using Application.Features.Users.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Users.Commands
{
    public class UpdateAddressCommandHandler(
        IAddressRepository addressRepository,
        ICurrentUserService currentUser) : ICommandHandler<UpdateAddressCommand, AddressResponse>
    {
        public async Task<AddressResponse> Handle(
            UpdateAddressCommand request,
            CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var address = await addressRepository.GetOwnedAsync(request.Id, userId, cancellationToken)
                          ?? throw new NotFoundException(ErrorCode.AddressNotFound);

            if (request.IsDefault && !address.IsDefault)
            {
                await addressRepository.ClearDefaultAsync(userId, cancellationToken);
                address.SetDefault();
            }
            else if (!request.IsDefault && address.IsDefault)
            {
                address.UnsetDefault();
            }

            address.Update(
                request.RecipientName.Trim(),
                request.Phone.Trim(),
                request.Province.Trim(),
                request.District.Trim(),
                request.Ward.Trim(),
                request.Street.Trim());

            return AddressResponse.From(address);
        }
    }
}
