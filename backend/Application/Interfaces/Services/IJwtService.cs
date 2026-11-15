namespace Application.Interfaces.Services
{
    public interface IJwtService
    {
        string GenerateAccessToken(Guid userId, string email, string role);
        string GenerateRefreshToken(Guid userId, string email, string role);
        Guid? ValidateRefreshToken(string refreshToken);
        string HashPassword(string password);
        bool VerifyPassword(string providedPassword, string hashedPassword);
    }
}
