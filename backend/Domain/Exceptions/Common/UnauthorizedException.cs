namespace Domain.Exceptions.Common
{
    /// <summary>Authentication failed (HTTP 401).</summary>
    public class UnauthorizedException(string code) : DomainException(code)
    {
    }
}
