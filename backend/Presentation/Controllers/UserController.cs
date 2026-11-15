using Application.Features.Authentication.Commands;
using Application.Features.Authentication.Requests;
using Application.Features.Authentication.Responses;
using Application.Features.Users.Commands;
using Application.Features.Users.Queries;
using Application.Features.Users.Requests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Presentation.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class UserController(ISender mediator) : ControllerBase
    {
        private readonly ISender _mediator = mediator;

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Login([FromBody] AuthRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new LoginCommand(request.Email, request.Password), cancellationToken);
            return Ok(result);
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new RegisterCommand(request.Email, request.FullName, request.Password, request.PhoneNumber, request.AvatarUrl),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpPost("send-otp")]
        [EnableRateLimiting("otp")]
        [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new SendOtpCommand(request.Email), cancellationToken);
            return Ok(result);
        }

        [HttpPost("verify-otp")]
        [EnableRateLimiting("otp")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new VerifyOtpCommand(request.Email, request.Otp, request.Password, request.FullName, request.PhoneNumber),
                cancellationToken);

            return Ok(result);
        }

        [HttpPost("google")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GoogleLoginCommand(request.IdToken), cancellationToken);
            return Ok(result);
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("auth")]
        [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), cancellationToken);
            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new LogoutCommand(), cancellationToken);
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetMeQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpPut("me")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateMe(
            [FromBody] UpdateMeRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new UpdateMeCommand(
                    request.FullName,
                    request.PhoneNumber,
                    request.AvatarUrl,
                    request.Locale,
                    request.MarketingConsent),
                cancellationToken);

            return Ok(result);
        }

        [HttpPut("me/password")]
        [Authorize]
        [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangeMyPasswordRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new ChangeMyPasswordCommand(request.CurrentPassword, request.NewPassword),
                cancellationToken);

            return Ok(result);
        }

        [HttpGet("me/addresses")]
        [Authorize]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> ListAddresses(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new ListAddressesQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpPost("me/addresses")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateAddress(
            [FromBody] AddressRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new CreateAddressCommand(
                    request.RecipientName,
                    request.Phone,
                    request.Province,
                    request.District,
                    request.Ward,
                    request.Street,
                    request.IsDefault),
                cancellationToken);

            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpPut("me/addresses/{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateAddress(
            int id,
            [FromBody] AddressRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(
                new UpdateAddressCommand(
                    id,
                    request.RecipientName,
                    request.Phone,
                    request.Province,
                    request.District,
                    request.Ward,
                    request.Street,
                    request.IsDefault),
                cancellationToken);

            return Ok(result);
        }

        [HttpDelete("me/addresses/{id:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteAddress(int id, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new DeleteAddressCommand(id), cancellationToken);
            return Ok(result);
        }
    }
}
