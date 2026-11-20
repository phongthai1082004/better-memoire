using System.Text.Json.Nodes;
using Domain.Entities.Books;

namespace Application.Features.Books.Responses
{
    public record PageSummaryResponse(string Id, int Position, int Version, int SchemaVersion)
    {
        public static PageSummaryResponse From(BookPage page) => new(page.Id, page.Position, page.Version, page.SchemaVersion);
    }

    public record BookManifestResponse(Guid Id, Guid? SampleBookId, string Title, string Type, string Style, string Font, string Cover, string? CoverUrl, double? PaperHeight, double? PaperWidth, int PageCount, int SchemaVersion, long LastEventSeq, IReadOnlyList<PageSummaryResponse> Pages)
    {
        public static BookManifestResponse From(Book book) => new(book.Id, book.SampleBookId, book.Title, book.Type, book.Style, book.Font, book.Cover, book.CoverUrl, book.PaperHeight, book.PaperWidth, book.PageCount, book.SchemaVersion, book.LastEventSeq, book.Pages.OrderBy(page => page.Position).Select(PageSummaryResponse.From).ToList());
    }

    public record BookPageResponse(string Id, int Position, int Version, int SchemaVersion, JsonNode? Content, DateTimeOffset UpdatedAt)
    {
        public static BookPageResponse From(BookPage page) => new(page.Id, page.Position, page.Version, page.SchemaVersion, JsonNode.Parse(page.Content) ?? new JsonObject(), page.UpdatedAt);
    }
}
