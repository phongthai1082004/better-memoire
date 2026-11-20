using Domain.Abstractions.Entities;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Domain.Entities.Books
{
    /// <summary>
    /// Book aggregate root (soft delete). Owns the editor pages; pages are hard-deleted
    /// because ordered content is frozen in <c>OrderItem.ContentSnapshot</c>.
    /// </summary>
    public class Book : SoftDeleteAggregateRoot
    {
        private readonly List<BookPage> _pages = [];

        public Guid UserId { get; private set; }
        public Guid? SampleBookId { get; private set; }
        public string Type { get; private set; } = string.Empty;
        public string Title { get; private set; } = string.Empty;
        public string Style { get; private set; } = string.Empty;
        public string Font { get; private set; } = string.Empty;
        public string Cover { get; private set; } = string.Empty;
        public string? CoverUrl { get; private set; }
        public double? PaperHeight { get; private set; }
        public double? PaperWidth { get; private set; }
        public int PageCount { get; private set; }
        public int SchemaVersion { get; private set; } = 2;
        public long LastEventSeq { get; private set; }

        public IReadOnlyCollection<BookPage> Pages => _pages.AsReadOnly();

        private Book()
        {
        }

        public Book(Guid userId, string title, string type, string style, string font, string cover, Guid? sampleBookId = null, string? coverUrl = null, double? paperHeight = null, double? paperWidth = null)
        {
            UserId = userId;
            Title = title;
            Type = type;
            Style = style;
            Font = font;
            Cover = cover;
            SampleBookId = sampleBookId;
            CoverUrl = coverUrl;
            PaperHeight = paperHeight;
            PaperWidth = paperWidth;
        }

        public void UpdateMetadata(string title, string style, string font, string cover, string? coverUrl, double? paperHeight, double? paperWidth)
        {
            Title = title;
            Style = style;
            Font = font;
            Cover = cover;
            CoverUrl = coverUrl;
            PaperHeight = paperHeight;
            PaperWidth = paperWidth;
        }

        public BookPage AddPage(string pageId, int position, string content, int version = 1)
        {
            if (_pages.Any(p => p.Id == pageId))
                throw new DomainRuleException(ErrorCode.BookPageExists);

            var page = new BookPage(pageId, Id, position, content, version);
            _pages.Add(page);
            PageCount = _pages.Count;
            return page;
        }

        /// <summary>
        /// Upserts a client-authored page. <paramref name="baseVersion"/> is the version the
        /// editor loaded; a mismatch is an optimistic-concurrency conflict.
        /// </summary>
        public BookPage UpsertPage(string pageId, int position, string content, int baseVersion)
        {
            var page = _pages.FirstOrDefault(p => p.Id == pageId);
            if (page is null)
                return AddPage(pageId, position, content, baseVersion + 1);

            if (page.Version != baseVersion)
                throw new DomainRuleException(ErrorCode.BookPageVersionConflict);

            page.Update(position, content);
            return page;
        }

        public bool RemovePage(string pageId)
        {
            var page = _pages.FirstOrDefault(p => p.Id == pageId);
            if (page is null)
                return false;

            _pages.Remove(page);
            for (var index = 0; index < _pages.Count; index++)
                _pages[index].SetPosition(index);
            PageCount = _pages.Count;
            return true;
        }

        public void ReplacePages(IEnumerable<(string Id, int Position, string Content)> pages)
        {
            _pages.Clear();
            foreach (var (id, position, content) in pages)
                _pages.Add(new BookPage(id, Id, position, content));

            PageCount = _pages.Count;
        }

        public void RecalculatePageCount() => PageCount = _pages.Count;

        public long NextEventSeq() => ++LastEventSeq;

        public void UpdateTitle(string title) => Title = title;

        public bool ReorderPages(IReadOnlyList<string> pageIds)
        {
            if (pageIds.Count != _pages.Count)
                return false;

            var ordered = new List<BookPage>(_pages.Count);
            foreach (var pageId in pageIds)
            {
                var page = _pages.FirstOrDefault(item => item.Id == pageId);
                if (page is null)
                    return false;
                ordered.Add(page);
            }

            for (var index = 0; index < ordered.Count; index++)
                ordered[index].SetPosition(index);

            _pages.Clear();
            _pages.AddRange(ordered);
            PageCount = _pages.Count;
            return true;
        }
    }
}
