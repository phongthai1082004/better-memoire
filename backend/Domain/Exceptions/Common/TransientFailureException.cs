namespace Domain.Exceptions.Common
{
    /// <summary>A retryable external-service or infrastructure failure (HTTP 503).</summary>
    public class TransientFailureException : DomainException
    {
        public TransientFailureException(string code) : base(code)
        {
        }

        public TransientFailureException(string code, Exception? innerException) : base(code, innerException)
        {
        }
    }

    /// <summary>Request throttling / OTP lockout (HTTP 429).</summary>
    public class TooManyRequestsException(string code) : DomainException(code)
    {
    }
}
