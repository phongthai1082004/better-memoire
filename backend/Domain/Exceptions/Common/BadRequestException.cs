namespace Domain.Exceptions.Common
{
    public class BadRequestException : DomainException
    {
        public BadRequestException(string code) : base(code)
        {
        }

        public BadRequestException(string code, Exception? innerException) : base(code, innerException)
        {
        }
    }

    public class DomainRuleException(string code) : DomainException(code)
    {
    }
}
