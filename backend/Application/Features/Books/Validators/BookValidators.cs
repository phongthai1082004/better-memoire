using Application.Features.Books.Commands;
using Application.Features.Books.Services;
using FluentValidation;

namespace Application.Features.Books.Validators
{
    public class CreateBookCommandValidator : AbstractValidator<CreateBookCommand>
    {
        public CreateBookCommandValidator()
        {
            RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
            RuleFor(x => x.Type).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Style).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Font).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Cover).NotEmpty().MaximumLength(50);
        }
    }

    public class PatchBookPageCommandValidator : AbstractValidator<PatchBookPageCommand>
    {
        public PatchBookPageCommandValidator()
        {
            RuleFor(x => x.BookId).NotEmpty();
            RuleFor(x => x.PageId).NotEmpty().MaximumLength(64);
            RuleFor(x => x.BaseVersion).GreaterThan(0);
            RuleFor(x => x.ClientMutationId).NotEmpty();
            RuleFor(x => x.Operations).NotEmpty();
            RuleForEach(x => x.Operations).ChildRules(operation =>
            {
                operation.RuleFor(x => x.Op).Must(value => value.Equals("add", StringComparison.OrdinalIgnoreCase) || value.Equals("replace", StringComparison.OrdinalIgnoreCase) || value.Equals("remove", StringComparison.OrdinalIgnoreCase));
                operation.RuleFor(x => x.Path).Must(value => value is "/schemaVersion" or "/background" or "/elements");
            });
        }
    }
}
