using Application.Features.Authentication.Commands;
using Domain.Resources;
using FluentValidation;
using Microsoft.Extensions.Localization;

namespace Application.Features.Authentication.Validators
{
    public class SendOtpCommandValidator : AbstractValidator<SendOtpCommand>
    {
        public SendOtpCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["Validation.EmailRequired"])
                .EmailAddress().WithMessage(localizer["Validation.EmailInvalid"]);
        }
    }

    public class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
    {
        public VerifyOtpCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage(localizer["Validation.EmailRequired"])
                .EmailAddress().WithMessage(localizer["Validation.EmailInvalid"]);

            RuleFor(x => x.Otp)
                .NotEmpty().WithMessage(localizer["Validation.OtpRequired"])
                .Matches(@"^\d{6}$").WithMessage(localizer["Validation.OtpSixDigits"]);

            RuleFor(x => x.Password)
                .MinimumLength(8).WithMessage(localizer["Validation.PasswordMin8"])
                .Matches(@"[A-Z]").WithMessage(localizer["Validation.PasswordUppercase"])
                .Matches(@"[a-z]").WithMessage(localizer["Validation.PasswordLowercase"])
                .Matches(@"[0-9]").WithMessage(localizer["Validation.PasswordNumber"])
                .Matches(@"[\W_]").WithMessage(localizer["Validation.PasswordSymbol"])
                .When(x => !string.IsNullOrEmpty(x.Password));

            RuleFor(x => x.FullName)
                .MaximumLength(100).WithMessage(localizer["Validation.FullNameMax", 100])
                .When(x => !string.IsNullOrEmpty(x.FullName));

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^(0[3|5|7|8|9])+([0-9]{8})$")
                .WithMessage(localizer["Validation.PhoneInvalid"])
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
        }
    }

    public class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
    {
        public GoogleLoginCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.IdToken)
                .NotEmpty().WithMessage(localizer["Validation.GoogleCredentialRequired"]);
        }
    }

    public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
    {
        public RefreshTokenCommandValidator(IStringLocalizer<Message> localizer)
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty().WithMessage(localizer["Validation.RefreshRequired"]);
        }
    }
}
