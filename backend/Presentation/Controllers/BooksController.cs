using Application.Features.Books.Commands;
using Application.Features.Books.Queries;
using Application.Features.Books.Requests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/v1/books")]
    [ApiController]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class BooksController(ISender mediator) : ControllerBase
    {
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] CreateBookRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(
                new CreateBookCommand(
                    request.Title,
                    request.Type,
                    request.Style,
                    request.Font,
                    request.Cover,
                    request.CoverUrl,
                    request.PaperHeight,
                    request.PaperWidth,
                    request.SampleBookId),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpGet]
        public async Task<IActionResult> List(CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new ListMyBooksQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpGet("{bookId:guid}")]
        public async Task<IActionResult> Get(Guid bookId, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new GetBookManifestQuery(bookId), cancellationToken);
            return Ok(result);
        }

        [HttpGet("{bookId:guid}/pages")]
        public async Task<IActionResult> GetPages(Guid bookId, [FromQuery] int from = 0, [FromQuery] int to = 4, CancellationToken cancellationToken = default)
        {
            var result = await mediator.Send(new GetBookPageWindowQuery(bookId, from, to), cancellationToken);
            return Ok(result);
        }

        [HttpPost("{bookId:guid}/pages")]
        public async Task<IActionResult> AddPage(Guid bookId, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new AddBookPageCommand(bookId), cancellationToken);
            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpPatch("{bookId:guid}/pages/order")]
        public async Task<IActionResult> ReorderPages(Guid bookId, [FromBody] ReorderBookPagesRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new ReorderBookPagesCommand(bookId, request.PageIds), cancellationToken);
            return Ok(result);
        }

        [HttpDelete("{bookId:guid}/pages/{pageId}")]
        public async Task<IActionResult> DeletePage(Guid bookId, string pageId, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new DeleteBookPageCommand(bookId, pageId), cancellationToken);
            return Ok(result);
        }

        [HttpPatch("{bookId:guid}")]
        public async Task<IActionResult> UpdateTitle(Guid bookId, [FromBody] UpdateBookTitleRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new UpdateBookTitleCommand(bookId, request.Title), cancellationToken);
            return Ok(result);
        }

        [HttpPatch("{bookId:guid}/pages/{pageId}")]
        public async Task<IActionResult> PatchPage(Guid bookId, string pageId, [FromBody] PatchBookPageRequest request, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(
                new PatchBookPageCommand(
                    bookId,
                    pageId,
                    request.BaseVersion,
                    request.ClientMutationId,
                    request.Operations,
                    request.ElementDelta),
                cancellationToken);
            return Ok(result);
        }
    }
}
