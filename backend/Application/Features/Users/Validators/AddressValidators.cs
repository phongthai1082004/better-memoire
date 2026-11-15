using Application.Features.Users.Commands;
using FluentValidation;

namespace Application.Features.Users.Validators
{
    public class CreateAddressCommandValidator : AbstractValidator<CreateAddressCommand>
    {
        public CreateAddressCommandValidator()
        {
            RuleFor(x => x.RecipientName).NotEmpty().Length(2, 150);
            RuleFor(x => x.Phone)
                .NotEmpty()
                .Matches(@"^(0[35789])[0-9]{8}$")
                .WithMessage("Phone number must be a valid Vietnamese number.");
            RuleFor(x => x.Province).NotEmpty().MaximumLength(150);
            RuleFor(x => x.District).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Ward).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Street).NotEmpty().MaximumLength(300);
        }
    }

    public class UpdateAddressCommandValidator : AbstractValidator<UpdateAddressCommand>
    {
        public UpdateAddressCommandValidator()
        {
            RuleFor(x => x.Id).GreaterThan(0);
            RuleFor(x => x.RecipientName).NotEmpty().Length(2, 150);
            RuleFor(x => x.Phone)
                .NotEmpty()
                .Matches(@"^(0[35789])[0-9]{8}$")
                .WithMessage("Phone number must be a valid Vietnamese number.");
            RuleFor(x => x.Province).NotEmpty().MaximumLength(150);
            RuleFor(x => x.District).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Ward).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Street).NotEmpty().MaximumLength(300);
        }
    }
}
