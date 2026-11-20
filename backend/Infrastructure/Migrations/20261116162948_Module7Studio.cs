using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Module7Studio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "LastEventSeq",
                table: "books",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "SchemaVersion",
                table: "books",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "SchemaVersion",
                table: "book_pages",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "book_page_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    PageId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Seq = table.Column<long>(type: "bigint", nullable: false),
                    Type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BaseVersion = table.Column<int>(type: "integer", nullable: false),
                    ResultVersion = table.Column<int>(type: "integer", nullable: false),
                    ClientMutationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Patch = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_book_page_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_book_page_events_books_BookId",
                        column: x => x.BookId,
                        principalTable: "books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_book_page_events_BookId_CreatedOnUtc",
                table: "book_page_events",
                columns: new[] { "BookId", "CreatedOnUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_book_page_events_BookId_Seq",
                table: "book_page_events",
                columns: new[] { "BookId", "Seq" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_book_page_events_PageId_ClientMutationId",
                table: "book_page_events",
                columns: new[] { "PageId", "ClientMutationId" },
                unique: true,
                filter: "\"ClientMutationId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "book_page_events");

            migrationBuilder.DropColumn(
                name: "LastEventSeq",
                table: "books");

            migrationBuilder.DropColumn(
                name: "SchemaVersion",
                table: "books");

            migrationBuilder.DropColumn(
                name: "SchemaVersion",
                table: "book_pages");
        }
    }
}
