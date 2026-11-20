using Application.Common.Logging;
using MediatR;
using Microsoft.Extensions.Logging;
namespace Application.Behaviors
{
    public class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
        : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
    {
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            var requestName = typeof(TRequest).Name;
            logger.LogIfEnabled(LogLevel.Information, "Processing request {RequestName}", requestName);
            var response = await next();
            logger.LogIfEnabled(LogLevel.Information, "Completed request {RequestName}", requestName);
            return response;
        }
    }
}
