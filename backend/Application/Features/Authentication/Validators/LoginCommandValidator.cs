using Application.Features.Authentication.Commands;
using Domain.Resources;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace Application.Features.Authentication.Validators
{
    public class LoginCommandValidator : AbstractValidator<LoginCommand>
    {
        public LoginCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["Validation.EmailRequired"])
                .EmailAddress().WithMessage(localizer["Validation.EmailInvalid"]);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage(localizer["Validation.PasswordRequired"])
                .MinimumLength(6).WithMessage(localizer["Validation.PasswordMin6"]);
        }
    }
}
