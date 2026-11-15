using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSampleBookType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sample_books_Type_Status_SortOrder",
                table: "sample_books");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "sample_books");

            migrationBuilder.CreateIndex(
                name: "IX_sample_books_Status_SortOrder",
                table: "sample_books",
                columns: new[] { "Status", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sample_books_Status_SortOrder",
                table: "sample_books");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "sample_books",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_sample_books_Type_Status_SortOrder",
                table: "sample_books",
                columns: new[] { "Type", "Status", "SortOrder" });
        }
    }
}
