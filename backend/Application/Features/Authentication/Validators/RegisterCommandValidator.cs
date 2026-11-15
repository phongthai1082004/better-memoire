using Application.Features.Authentication.Commands;
using Domain.Resources;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace Application.Features.Authentication.Validators
{
    public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
    {
        public RegisterCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["Validation.EmailRequired"])
                .EmailAddress().WithMessage(localizer["Validation.EmailInvalid"]);

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage(localizer["Validation.FullNameRequired"])
                .MaximumLength(100).WithMessage(localizer["Validation.FullNameMax", 100]);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(localizer["Validation.PasswordRequired"])
                .MinimumLength(8).WithMessage(localizer["Validation.PasswordMin8"])
                .Matches(@"[A-Z]").WithMessage(localizer["Validation.PasswordUppercase"])
                .Matches(@"[a-z]").WithMessage(localizer["Validation.PasswordLowercase"])
                .Matches(@"[0-9]").WithMessage(localizer["Validation.PasswordNumber"])
                .Matches(@"[\W_]").WithMessage(localizer["Validation.PasswordSymbol"]);

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^(0[3|5|7|8|9])+([0-9]{8})$")
                .WithMessage(localizer["Validation.PhoneInvalid"])
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.AvatarUrl)
                .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
                .WithMessage(localizer["Validation.AvatarInvalid"])
                .When(x => !string.IsNullOrEmpty(x.AvatarUrl));
        }
    }
}
