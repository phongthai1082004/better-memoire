using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Exceptions.Idempotency;
using Domain.Resources;
using Infrastructure.Logging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Localization;

namespace Presentation.Middlewares
{
    public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IStringLocalizer<Message> localizer)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                logger.LogWithLocation(LogLevel.Information, $"Request aborted by client: {context.Request.Path}");
            }
            catch (Exception ex)
            {
                if (context.Response.HasStarted)
                {
                    logger.LogWithLocation(LogLevel.Warning, "Response already started, cannot write custom error body.", ex);
                    throw;
                }
                var (statusCode, code, message) = Resolve(ex);
                if (statusCode >= StatusCodes.Status500InternalServerError)
                {
                    logger.LogWithLocation(LogLevel.Error, $"Unhandled server error on {context.Request.Method} {context.Request.Path}: {ex.Message}", ex);
                }
                else
                {
                    logger.LogWithLocation(LogLevel.Information, $"Client request error ({statusCode}, {code}) on {context.Request.Method} {context.Request.Path}: {message}");
                }

                var problem = new ProblemDetails
                {
                    Type = $"https://httpstatuses.io/{statusCode}",
                    Title = statusCode == StatusCodes.Status401Unauthorized ? localizer["Error.UnauthorizedTitle"].Value : ReasonPhrases.GetReasonPhrase(statusCode),
                    Status = statusCode,
                    Detail = message,
                    Instance = context.Request.Path
                };
                problem.Extensions["code"] = code;
                problem.Extensions["traceId"] = context.TraceIdentifier;

                context.Response.Clear();
                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(problem);
            }
        }

        private (int StatusCode, string Code, string Message) Resolve(Exception exception)
        {
            if (exception is DomainException domainException)
            {
                var statusCode = domainException switch
                {
                    NotFoundException => StatusCodes.Status404NotFound,
                    UnauthorizedException => StatusCodes.Status401Unauthorized,
                    ForbiddenException => StatusCodes.Status403Forbidden,
                    ConflictException or IdempotencyProcessingException => StatusCodes.Status409Conflict,
                    UnprocessableEntityException => StatusCodes.Status422UnprocessableEntity,
                    TooManyRequestsException => StatusCodes.Status429TooManyRequests,
                    TransientFailureException => StatusCodes.Status503ServiceUnavailable,
                    _ => StatusCodes.Status400BadRequest
                };

                return (statusCode, domainException.Code, localizer[ErrorCodeCatalog.GetMessageKey(domainException.Code)].Value);
            }

            if (exception is FluentValidation.ValidationException validation)
                return (StatusCodes.Status400BadRequest, ErrorCode.ValidationFailed, string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

            if (exception is KeyNotFoundException)
                return (StatusCodes.Status404NotFound, ErrorCode.NotFound, localizer["Error.NotFound"].Value);

            if (exception is UnauthorizedAccessException)
                return (StatusCodes.Status403Forbidden, ErrorCode.Forbidden, localizer["Error.Forbidden"].Value);

            if (exception is ArgumentException or InvalidOperationException)
                return (StatusCodes.Status400BadRequest, ErrorCode.BadRequest, localizer["Error.BadRequest"].Value);

            if (exception is OperationCanceledException or TimeoutException)
                return (StatusCodes.Status504GatewayTimeout, ErrorCode.Timeout, localizer["Error.TimedOut"].Value);

            return (StatusCodes.Status500InternalServerError, ErrorCode.InternalError, localizer["Error.Unexpected"].Value);
        }
    }
}
