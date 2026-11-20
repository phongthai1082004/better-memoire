using Microsoft.Extensions.Logging;

namespace Application.Common.Logging
{
    public static class LoggerExtensions
    {
        public static void LogIfEnabled(this ILogger logger, LogLevel logLevel, string? message, params object?[] args)
        {
            if (!logger.IsEnabled(logLevel)) return;
            logger.Log(logLevel, message, args);
        }
    }
}
