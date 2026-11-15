namespace Domain.Exceptions.Common
{
    public class NotFoundException(string code) : DomainException(code)
    {
    }
}
