namespace Domain.Exceptions.Common
{
    /// <summary>An exception that carries a stable domain error code.</summary>
    public interface IErrorCodedException
    {
        string Code { get; }
    }

    public abstract class DomainException : Exception, IErrorCodedException
    {
        protected DomainException(string code) : base(code)
        {
            Code = code;
        }

        protected DomainException(string code, Exception? innerException) : base(code, innerException)
        {
            Code = code;
        }

        public string Code { get; }
    }
}
