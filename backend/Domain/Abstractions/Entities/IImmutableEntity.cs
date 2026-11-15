namespace Domain.Abstractions.Entities
{
    /// <summary>
    /// Marker for append-only entities. Rows are never physically or logically deleted;
    /// state changes only create new rows or update status columns.
    /// </summary>
    public interface IImmutableEntity
    {
    }
}
