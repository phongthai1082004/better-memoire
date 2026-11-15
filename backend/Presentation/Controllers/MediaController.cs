using Application.Features.Media.Commands;
using Application.Features.Media.Queries;
using Application.Features.Media.Responses;
using Application.Features.Authentication.Responses;
using Domain.Enums.Media;
using Domain.Exceptions.Common;
using Domain.Errors;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class MediaController(ISender mediator) : ControllerBase
    {
        [HttpGet("upload-signature")]
        public async Task<IActionResult> UploadSignature(
            [FromQuery] string type = "gallery",
            CancellationToken cancellationToken = default)
        {
            if (!Enum.TryParse<UploadKind>(type, true, out var kind))
                throw new BadRequestException(ErrorCode.ValidationFailed);

            var result = await mediator.Send(new GetUploadTicketQuery(kind), cancellationToken);
            return Ok(result);
        }

        [HttpPost("images")]
        public async Task<IActionResult> SaveImage(
            [FromBody] SaveUserImageRequest request,
            CancellationToken cancellationToken)
        {
            var result = await mediator.Send(
                new SaveUserImageCommand(
                    request.Url,
                    request.PublicId,
                    request.ThumbUrl,
                    request.Width,
                    request.Height,
                    request.Size,
                    request.MimeType,
                    request.OriginalName,
                    request.ContentHash),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpGet("images")]
        public async Task<IActionResult> ListImages(
            [FromQuery] int limit = 24,
            CancellationToken cancellationToken = default)
        {
            var result = await mediator.Send(new GetUserImagesQuery(limit), cancellationToken);
            return Ok(result);
        }

        [HttpDelete("images/{id:guid}")]
        public async Task<IActionResult> DeleteImage(Guid id, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new DeleteUserImageCommand(id), cancellationToken);
            return Ok(result);
        }
    }

    public record SaveUserImageRequest(
        string Url,
        string PublicId,
        string? ThumbUrl,
        int? Width,
        int? Height,
        int? Size,
        string? MimeType,
        string? OriginalName,
        string? ContentHash);
}
