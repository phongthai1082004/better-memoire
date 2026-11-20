using Application.CQRS;
using Application.Features.Users.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Users.Queries
{
    public record ListAddressesQuery : IQuery<IReadOnlyList<AddressResponse>>;

    public class ListAddressesQueryHandler(IAddressRepository addressRepository, ICurrentUserService currentUser)
        : IQueryHandler<ListAddressesQuery, IReadOnlyList<AddressResponse>>
    {
        public async Task<IReadOnlyList<AddressResponse>> Handle(ListAddressesQuery request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var addresses = await addressRepository.GetForUserAsync(userId, cancellationToken);
            return addresses.Select(AddressResponse.From).ToList();
        }
    }
}
