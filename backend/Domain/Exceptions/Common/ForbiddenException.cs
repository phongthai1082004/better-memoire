namespace Domain.Exceptions.Common
{
    /// <summary>The caller is authenticated but lacks permission (HTTP 403).</summary>
    public class ForbiddenException(string code) : DomainException(code)
    {
    }
}
