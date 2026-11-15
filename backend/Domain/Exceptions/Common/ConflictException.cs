namespace Domain.Exceptions.Common
{
    public class ConflictException : DomainException
    {
        public ConflictException(string code) : base(code)
        {
        }

        public ConflictException(string code, Exception? innerException) : base(code, innerException)
        {
        }
    }
}
