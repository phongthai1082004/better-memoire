using Application.Features.Users.Commands;
using FluentValidation;

namespace Application.Features.Users.Validators
{
    public class UpdateMeCommandValidator : AbstractValidator<UpdateMeCommand>
    {
        public UpdateMeCommandValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^(0[35789])[0-9]{8}$")
                .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber))
                .WithMessage("Phone number must be a valid Vietnamese number.");

            RuleFor(x => x.AvatarUrl)
                .Must(url => string.IsNullOrWhiteSpace(url) || (Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)))
                .WithMessage("Avatar URL must be an absolute URL.");

            RuleFor(x => x.Locale)
                .Must(locale => string.IsNullOrWhiteSpace(locale) || locale is "vi" or "en")
                .WithMessage("Locale must be vi or en.");
        }
    }

    public class ChangeMyPasswordCommandValidator : AbstractValidator<ChangeMyPasswordCommand>
    {
        public ChangeMyPasswordCommandValidator()
        {
            RuleFor(x => x.NewPassword)
                .NotEmpty()
                .MinimumLength(8)
                .MaximumLength(128);

            RuleFor(x => x.CurrentPassword)
                .MaximumLength(128)
                .When(x => !string.IsNullOrEmpty(x.CurrentPassword));
        }
    }
}
