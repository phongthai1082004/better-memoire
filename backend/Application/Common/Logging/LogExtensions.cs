using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Application.Common.Logging
{
    public static partial class LogExtensions
    {
        public static void LogIfEnabled(this ILogger logger, LogLevel logLevel, string? message, params object?[] args)
        {
            if (!logger.IsEnabled(logLevel)) return;
            logger.Log(logLevel, message, args);
        }

        public static void LogIfEnabled(this ILogger logger, LogLevel logLevel, Exception? exception, string? message, params object?[] args)
        {
            if (!logger.IsEnabled(logLevel)) return;
            logger.Log(logLevel, exception, message, args);
        }

        public static void LogWithLocation(this ILogger logger, LogLevel logLevel, string message, Exception? exception = null, [CallerMemberName] string memberName = "", [CallerFilePath] string sourceFilePath = "", [CallerLineNumber] int sourceLineNumber = 0)
        {
            logger.LogIfEnabled(logLevel, exception, "[{FileName}:{LineNumber} -> {Method}] {Message}", Path.GetFileName(sourceFilePath), sourceLineNumber, memberName, message);
        }

        [LoggerMessage(Level = LogLevel.Information, Message = "Request aborted by client: {Path}")]
        public static partial void LogRequestAborted(this ILogger logger, PathString path);
    }
}
