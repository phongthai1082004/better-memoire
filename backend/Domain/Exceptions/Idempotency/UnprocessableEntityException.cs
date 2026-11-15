using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Exceptions.Idempotency
{
    public class MissingIdempotencyKeyException() : DomainException(ErrorCode.IdempotencyMissingKey)
    {
    }

    public class IdempotencyProcessingException(Enums.Idempotency.IdempotencyStatus status)
        : DomainException(ErrorCode.IdempotencyInProgress)
    {
        public Enums.Idempotency.IdempotencyStatus Status { get; } = status;
    }

    public class UnprocessableEntityException(string code) : DomainException(code)
    {
    }
}
