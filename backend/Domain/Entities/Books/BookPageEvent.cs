using Domain.Abstractions.Entities;

namespace Domain.Entities.Books
{
    /// <summary>Append-only page mutation history. Never used to rebuild a page on read.</summary>
    public class BookPageEvent : BaseEntity<Guid>
    {
        public Guid BookId { get; private set; }
        public string PageId { get; private set; } = string.Empty;
        public Guid ActorId { get; private set; }
        public long Seq { get; private set; }
        public string Type { get; private set; } = string.Empty;
        public int BaseVersion { get; private set; }
        public int ResultVersion { get; private set; }
        public Guid? ClientMutationId { get; private set; }
        public string? Patch { get; private set; }

        private BookPageEvent()
        {
        }

        public BookPageEvent(Guid bookId, string pageId, Guid actorId, long seq, string type, int baseVersion, int resultVersion, Guid? clientMutationId, string? patch)
        {
            BookId = bookId;
            PageId = pageId;
            ActorId = actorId;
            Seq = seq;
            Type = type;
            BaseVersion = baseVersion;
            ResultVersion = resultVersion;
            ClientMutationId = clientMutationId;
            Patch = patch;
        }
    }
}
