using System.Threading.RateLimiting;
using Domain.Errors;
using Domain.Resources;
using Microsoft.Extensions.Localization;

namespace Presentation.Extensions
{
    public static class RateLimiterExtensions
    {
        public static IServiceCollection AddApiRateLimiter(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                {
                    var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
                });

                options.AddPolicy("auth", httpContext =>
                {
                    var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    return RateLimitPartition.GetFixedWindowLimiter($"auth:{clientIp}", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
                });

                options.AddPolicy("otp", httpContext =>
                {
                    var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    return RateLimitPartition.GetFixedWindowLimiter($"otp:{clientIp}", _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(15),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
                });

                options.OnRejected = async (context, cancellationToken) =>
                {
                    var localizer = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<Message>>();
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.HttpContext.Response.ContentType = "application/json";
                    var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        Title = localizer["Error.RateLimitedTitle"],
                        Detail = localizer["Error.RateLimitedDetail"],
                        Instance = context.HttpContext.Request.Path
                    };
                    problemDetails.Extensions["code"] = ErrorCode.RateLimited;
                    await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
                };
            });

            return services;
        }
    }
}
