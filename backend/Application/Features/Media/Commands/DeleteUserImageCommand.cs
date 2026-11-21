using Application.Common.Logging;
using Application.CQRS;
using Application.Features.Authentication.Responses;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Resources;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;

namespace Application.Features.Media.Commands
{
    public record DeleteUserImageCommand(Guid Id) : ICommand<MessageResponse>;

    public class DeleteUserImageCommandHandler(IUserImageRepository imageRepository, IStorageService storage, ICurrentUserService currentUser, IStringLocalizer<Message> localizer, ILogger<DeleteUserImageCommandHandler> logger)
            : ICommandHandler<DeleteUserImageCommand, MessageResponse>
    {
        public async Task<MessageResponse> Handle(DeleteUserImageCommand request, CancellationToken cancellationToken)
        {
            var userId = currentUser.UserId
                         ?? throw new UnauthorizedException(ErrorCode.AuthRequired);

            var image = await imageRepository.GetByIdForUserAsync(request.Id, userId, cancellationToken)
                        ?? throw new NotFoundException(ErrorCode.MediaNotFound);

            imageRepository.Delete(image);

            if (!string.IsNullOrWhiteSpace(image.PublicId))
            {
                try
                {
                    await storage.DeleteAsync(image.PublicId, cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogIfEnabled(LogLevel.Warning, ex, "Could not delete R2 asset {PublicId}", image.PublicId);
                }
            }

            return new MessageResponse(localizer["Media.Deleted"]);
        }
    }
}
