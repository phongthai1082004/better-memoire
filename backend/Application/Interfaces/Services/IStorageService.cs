namespace Application.Interfaces.Services
{
    public record UploadTicket(string UploadUrl, string Token, string Folder, long Expiry);

    public interface IStorageService
    {
        Task<UploadTicket> CreateUploadTicketAsync(string folder, CancellationToken cancellationToken = default);
        Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
        bool IsOwnedUrl(string? url);
    }
}
