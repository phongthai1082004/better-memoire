using Application.Features.Books.Services;

namespace Application.Features.Books.Requests
{
    public record CreateBookRequest(string Title, string Type, string Style, string Font, string Cover, string? CoverUrl, double? PaperHeight, double? PaperWidth, Guid? SampleBookId);

    public record PatchBookPageRequest(int BaseVersion, Guid ClientMutationId, IReadOnlyList<PagePatchOperation> Operations, ElementDelta? ElementDelta);

    public record ReorderBookPagesRequest(IReadOnlyList<string> PageIds);

    public record UpdateBookTitleRequest(string Title);
}
