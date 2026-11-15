using Application.CQRS;
using Application.Features.Users.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Users;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Users.Commands
{
    public class CreateAddressCommandHandler(
        IAddressRepository addressRepository,
        ICurrentUserService currentUser) : ICommandHandler<CreateAddressCommand, AddressResponse>
    {
        public async Task<AddressResponse> Handle(
            CreateAddressCommand request,
            CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            if (request.IsDefault)
                await addressRepository.ClearDefaultAsync(userId, cancellationToken);

            var address = new Address(
                userId,
                request.RecipientName.Trim(),
                request.Phone.Trim(),
                request.Province.Trim(),
                request.District.Trim(),
                request.Ward.Trim(),
                request.Street.Trim(),
                request.IsDefault);

            addressRepository.Insert(address);
            await addressRepository.SaveChangesAsync(cancellationToken);
            return AddressResponse.From(address);
        }
    }
}
