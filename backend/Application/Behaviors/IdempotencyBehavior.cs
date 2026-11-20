using System.Text.Json;
using Application.Cache.Common;
using Application.Common.Logging;
using Application.CQRS;
using Application.Interfaces.Services;
using Domain.Abstractions.Repository;
using Domain.Entities.Idempotency;
using Domain.Enums;
using Domain.Enums.Idempotency;
using Domain.Errors;
using Domain.Exceptions.Common;
using Domain.Exceptions.Idempotency;
using MediatR;
using Microsoft.Extensions.Logging;
namespace Application.Behaviors
{
    public class IdempotencyBehavior<TRequest, TResponse>(ICacheService cache, ICurrentUserService currentUser, IIdempotentRepository<IdempotencyRecord, int> idempotentRepository, ILogger<IdempotencyBehavior<TRequest, TResponse>> logger)
        : IPipelineBehavior<TRequest, TResponse> where TRequest : IIdempotentCommand<TResponse>
    {
        private static readonly TimeSpan PendingTtl = TimeSpan.FromMinutes(2);
        private static readonly TimeSpan CompletedTtl = TimeSpan.FromDays(1);

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            var idempotencyKey = currentUser.Idempotency ?? throw new MissingIdempotencyKeyException();
            var requestHash = IdempotencyRecord.ComputeRequestHash(currentUser.Endpoint, currentUser.UserId, currentUser.Payload);
            logger.LogIfEnabled(LogLevel.Debug, "Idempotency check {RequestName} key={IdempotencyKey} user={UserId} endpoint={Endpoint}", typeof(TRequest).Name, idempotencyKey, currentUser.UserId, currentUser.Endpoint);
            var dataKey = CacheKeys.IdempotencyShortData<TRequest>(idempotencyKey, currentUser.UserId, currentUser.Endpoint);
            var lockKey = CacheKeys.IdempotencyLockData<TRequest>(idempotencyKey, currentUser.UserId, currentUser.Endpoint);
            var cached = await cache.GetAsync<IdempotencyCacheEntry>(dataKey);
            if (cached is not null)
            {
                logger.LogIfEnabled(LogLevel.Debug, "Idempotency cache hit for {RequestName}", typeof(TRequest).Name);
                if (!string.Equals(cached.RequestHash, requestHash, StringComparison.Ordinal))
                {
                    logger.LogIfEnabled(LogLevel.Warning, "Idempotency payload mismatch (cache) for {RequestName}", typeof(TRequest).Name);
                    throw new UnprocessableEntityException(ErrorCode.IdempotencyPayloadMismatch);
                }
                if (cached.Status == IdempotencyStatus.Completed)
                {
                    logger.LogIfEnabled(LogLevel.Information, "Replaying idempotent response for {RequestName}", typeof(TRequest).Name);
                    return DeserializeResponse(cached.ResponseBody);
                }
                throw new ConflictException(ErrorCode.IdempotencyInProgress);
            }
            var existing = await idempotentRepository.GetByIdempotencyKey(idempotencyKey, currentUser.UserId, currentUser.Endpoint, cancellationToken);
            if (existing is not null)
            {
                logger.LogIfEnabled(LogLevel.Debug, "Idempotency DB hit for {RequestName} status={Status}", typeof(TRequest).Name, existing.Status);
                if (!string.Equals(existing.RequestHash, requestHash, StringComparison.Ordinal))
                {
                    logger.LogIfEnabled(LogLevel.Warning, "Idempotency payload mismatch (DB) for {RequestName}", typeof(TRequest).Name);
                    throw new UnprocessableEntityException(ErrorCode.IdempotencyPayloadMismatch);
                }
                if (existing.Status == IdempotencyStatus.Completed)
                {
                    logger.LogIfEnabled(LogLevel.Information, "Replaying idempotent response for {RequestName}", typeof(TRequest).Name);
                    await cache.SetAsync(dataKey, ToEntry(existing), CompletedTtl);
                    return DeserializeResponse(existing.ResponseBody);
                }
                if (existing.Status == IdempotencyStatus.Failed || existing.IsExpired(DateTimeOffset.UtcNow))
                {
                    logger.LogIfEnabled(LogLevel.Information, "Resetting idempotency record for retry {RequestName} (status={Status})", typeof(TRequest).Name, existing.Status);
                    idempotentRepository.Delete(existing);
                    await idempotentRepository.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    throw new ConflictException(ErrorCode.IdempotencyInProgress);
                }
            }
            bool isLocked = await cache.SetAsync(lockKey, idempotencyKey, TimeSpan.FromSeconds(30), CacheCondition.NotExists);
            if (!isLocked)
            {
                logger.LogIfEnabled(LogLevel.Debug, "Idempotency lock contention for {RequestName}", typeof(TRequest).Name);
                throw new ConflictException(ErrorCode.IdempotencyInProgress);
            }
            logger.LogIfEnabled(LogLevel.Debug, "Idempotency lock acquired for {RequestName}", typeof(TRequest).Name);
            var record = new IdempotencyRecord(idempotencyKey, currentUser.UserId, currentUser.Endpoint, requestHash, DateTimeOffset.UtcNow.Add(PendingTtl));
            idempotentRepository.Insert(record);
            await idempotentRepository.SaveChangesAsync(cancellationToken);
            try
            {
                var response = await next();
                record.Complete(200, JsonSerializer.Serialize(response), "application/json");
                await cache.SetAsync(dataKey, ToEntry(record), CompletedTtl);
                return response;
            }
            catch (Exception)
            {
                record.MarkFailed();
                throw;
            }
            finally
            {
                await idempotentRepository.SaveChangesAsync(cancellationToken);
                const string releaseLockScript = @"
                    if redis.call('get', KEYS[1]) == ARGV[1] then
                        return redis.call('del', KEYS[1])
                    else
                        return 0
                    end";
                await cache.ExecuteScriptAsync(releaseLockScript, keys: [lockKey], args: [idempotencyKey]);
            }
        }

        private static IdempotencyCacheEntry ToEntry(IdempotencyRecord record) =>
            new(record.RequestHash ?? string.Empty, record.Status, record.ResponseBody);

        private static TResponse DeserializeResponse(string? responseBody)
        {
            if (typeof(TResponse) == typeof(Unit) || string.IsNullOrWhiteSpace(responseBody))
                return (TResponse)(object)Unit.Value;
            return JsonSerializer.Deserialize<TResponse>(responseBody)!;
        }
    }
}
