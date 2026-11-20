using Application.Common.Logging;
using Application.CQRS;
using Application.Exceptions;
using Application.Interfaces.Database;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Behaviors
{
    public class TransactionBehavior<TRequest, TResponse>(ILogger<TransactionBehavior<TRequest, TResponse>> logger, IApplicationDbContext context, IDbExceptionTranslator translator) : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            if (request is not IBaseCommand)
                return await next();
            var requestName = typeof(TRequest).Name;
            await using var transaction = await context.BeginTransactionAsync(cancellationToken);
            try
            {
                var response = await next();
                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                logger.LogIfEnabled(LogLevel.Debug, "Committed database transaction for {RequestName}", requestName);
                return response;
            }
            catch (Exception ex)
            {
                logger.LogIfEnabled(LogLevel.Error, ex, "Transaction failed and rolling back for {RequestName}", requestName);
                try
                {
                    await transaction.RollbackAsync(cancellationToken);
                }
                catch (Exception rollbackEx)
                {
                    logger.LogIfEnabled(LogLevel.Error, rollbackEx, "Failed to rollback transaction for {RequestName}", requestName);
                }
                throw translator.Translate(ex);
            }
        }
    }
}
