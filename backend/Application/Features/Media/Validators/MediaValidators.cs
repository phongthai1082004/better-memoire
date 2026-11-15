using Application.Features.Media.Commands;
using FluentValidation;

namespace Application.Features.Media.Validators
{
    public class SaveUserImageCommandValidator : AbstractValidator<SaveUserImageCommand>
    {
        public SaveUserImageCommandValidator()
        {
            RuleFor(x => x.Url).NotEmpty();
            RuleFor(x => x.PublicId).NotEmpty();
            RuleFor(x => x.Width).GreaterThan(0).When(x => x.Width.HasValue);
            RuleFor(x => x.Height).GreaterThan(0).When(x => x.Height.HasValue);
            RuleFor(x => x.Size).GreaterThan(0).When(x => x.Size.HasValue);
            RuleFor(x => x.MimeType)
                .Must(mime => string.IsNullOrWhiteSpace(mime) ||
                              mime is "image/jpeg" or "image/png" or "image/webp" or "image/gif" or "image/avif" or "image/heic")
                .WithMessage("Unsupported image type.");
        }
    }
}
