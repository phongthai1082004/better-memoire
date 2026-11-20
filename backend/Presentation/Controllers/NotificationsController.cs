using Application.Features.Notifications.Commands;
using Application.Features.Notifications.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class NotificationsController(ISender mediator) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int limit = 20, CancellationToken cancellationToken = default)
        {
            var result = await mediator.Send(new GetNotificationsQuery(limit), cancellationToken);
            return Ok(result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
        {
            var unread = await mediator.Send(new GetUnreadNotificationCountQuery(), cancellationToken);
            return Ok(new { unread });
        }

        [HttpPatch("{id:guid}/read")]
        public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new SetNotificationReadCommand(id, true), cancellationToken);
            return Ok(result);
        }

        [HttpPatch("{id:guid}/unread")]
        public async Task<IActionResult> MarkUnread(Guid id, CancellationToken cancellationToken)
        {
            var result = await mediator.Send(new SetNotificationReadCommand(id, false), cancellationToken);
            return Ok(result);
        }
    }
}
