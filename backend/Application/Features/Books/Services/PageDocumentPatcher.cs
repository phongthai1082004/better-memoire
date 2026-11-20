using System.Text.Json;
using System.Text.Json.Nodes;
using Domain.Errors;
using Domain.Exceptions.Common;

namespace Application.Features.Books.Services
{
    public static class PageDocumentPatcher
    {
        private const int MaxDocumentBytes = 2 * 1024 * 1024;

        public static string Apply(string content, IReadOnlyList<PagePatchOperation> operations)
        {
            var root = JsonNode.Parse(string.IsNullOrWhiteSpace(content) ? "{}" : content)
                       as JsonObject ?? new JsonObject();

            foreach (var operation in operations)
            {
                var value = operation.Value is null
                    ? null
                    : JsonNode.Parse(operation.Value.Value.GetRawText());

                switch (operation.Path)
                {
                    case "/schemaVersion":
                        if (!string.Equals(operation.Op, "replace", StringComparison.OrdinalIgnoreCase))
                            throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                        ApplyField(root, "schemaVersion", operation.Op, value);
                        if (root["schemaVersion"] is not JsonValue schemaValue || !schemaValue.TryGetValue<int>(out var schemaVersion) || schemaVersion is < 1 or > 2)
                            throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                        break;
                    case "/background":
                        ApplyField(root, "background", operation.Op, value);
                        break;
                    case "/elements":
                        ApplyField(root, "elements", operation.Op, value);
                        break;
                    default:
                        throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                }
            }

            var canonical = new JsonObject
            {
                ["schemaVersion"] = root["schemaVersion"]?.DeepClone() ?? 2,
                ["background"] = root["background"]?.DeepClone() ?? "#f3f2ea",
                ["elements"] = root["elements"]?.DeepClone() ?? new JsonArray()
            };

            return Canonicalize(canonical);
        }

        /// <summary>
        /// Merge only changed/removed Fabric objects into an existing page.
        /// Object identity is the studio `id` property.
        /// </summary>
        public static string ApplyElementDelta(string content, ElementDelta delta)
        {
            var root = JsonNode.Parse(string.IsNullOrWhiteSpace(content) ? "{}" : content)
                       as JsonObject ?? new JsonObject();
            var elements = root["elements"] as JsonArray ?? new JsonArray();
            var indexes = new Dictionary<string, int>(StringComparer.Ordinal);

            for (var index = 0; index < elements.Count; index++)
            {
                if (elements[index] is JsonObject element && element["id"] is JsonValue idValue && idValue.TryGetValue<string>(out var id) && !string.IsNullOrWhiteSpace(id))
                {
                    indexes[id] = index;
                }
            }

            foreach (var removed in delta.Removed)
            {
                if (string.IsNullOrWhiteSpace(removed) || !indexes.TryGetValue(removed, out var index))
                    continue;
                elements.RemoveAt(index);
                indexes.Clear();
                for (var i = 0; i < elements.Count; i++)
                {
                    if (elements[i] is JsonObject element && element["id"] is JsonValue idValue && idValue.TryGetValue<string>(out var id) && !string.IsNullOrWhiteSpace(id))
                    {
                        indexes[id] = i;
                    }
                }
            }

            foreach (var changed in delta.Changed)
            {
                if (changed.ValueKind != JsonValueKind.Object)
                    throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                var element = JsonNode.Parse(changed.GetRawText()) as JsonObject
                              ?? throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                if (element["id"] is not JsonValue idValue || !idValue.TryGetValue<string>(out var id) || string.IsNullOrWhiteSpace(id))
                    throw new BadRequestException(ErrorCode.BookPagePatchInvalid);

                if (indexes.TryGetValue(id, out var index))
                    elements[index] = element;
                else
                {
                    indexes[id] = elements.Count;
                    elements.Add(element);
                }
            }

            root["elements"] = elements;
            return Canonicalize(root);
        }

        private static string Canonicalize(JsonObject root)
        {
            var canonical = new JsonObject
            {
                ["schemaVersion"] = root["schemaVersion"]?.DeepClone() ?? 2,
                ["background"] = root["background"]?.DeepClone() ?? "#f3f2ea",
                ["elements"] = root["elements"]?.DeepClone() ?? new JsonArray()
            };

            if (canonical["schemaVersion"] is not JsonValue schema || !schema.TryGetValue<int>(out var version) || version is < 1 or > 2)
                throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
            if (canonical["background"] is not JsonValue background || !background.TryGetValue<string>(out _))
                throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
            if (canonical["elements"] is not JsonArray)
                throw new BadRequestException(ErrorCode.BookPagePatchInvalid);

            var json = canonical.ToJsonString(JsonSerializerOptions.Default);
            if (System.Text.Encoding.UTF8.GetByteCount(json) > MaxDocumentBytes)
                throw new BadRequestException(ErrorCode.BookPageTooLarge);

            return json;
        }

        private static void ApplyField(JsonObject root, string property, string op, JsonNode? value)
        {
            switch (op.ToLowerInvariant())
            {
                case "add":
                case "replace":
                    if (value is null)
                        throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
                    root[property] = value;
                    break;
                case "remove":
                    root.Remove(property);
                    break;
                default:
                    throw new BadRequestException(ErrorCode.BookPagePatchInvalid);
            }
        }
    }

    public record PagePatchOperation(string Op, string Path, JsonElement? Value);

    public record ElementDelta(IReadOnlyList<JsonElement> Changed, IReadOnlyList<string> Removed);
}
