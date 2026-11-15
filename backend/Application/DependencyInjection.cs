using Application.Behaviors;
using Application.Features.Authentication.Services;
using Application.Features.Authentication.Validators;
using Application.Interfaces.Services;
using Application.Services;
using Domain.Configurations;
using Domain.Errors;
using Domain.Resources;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Application
{
    public static class ApplicationDependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(typeof(ApplicationDependencyInjection).Assembly);

                cfg.AddOpenBehavior(typeof(ExceptionHandlingBehavior<,>));
                cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
                cfg.AddOpenBehavior(typeof(PerformanceBehavior<,>));
                cfg.AddOpenBehavior(typeof(ValidatorBehavior<,>));
                cfg.AddOpenBehavior(typeof(IdempotencyBehavior<,>));
                cfg.AddOpenBehavior(typeof(TransactionBehavior<,>));
            });
            // Validator register
            services.AddValidatorsFromAssemblyContaining<RegisterCommandValidator>();

            // Configure JWT settings
            var jwtSection = configuration.GetSection("JwtSettings");
            services.Configure<JwtSettings>(jwtSection);
            var jwtSettings = jwtSection.Get<JwtSettings>() ?? throw new InvalidOperationException("JwtSettings is missing in configuration.");
            if (string.IsNullOrEmpty(jwtSettings.Key)) throw new InvalidOperationException("Secret key is not configured in Jwt Setting.");
            services.AddSingleton(jwtSettings);

            // OTP policy (expiry / attempts / resend cooldown)
            var otpSection = configuration.GetSection("Auth");
            var otpSettings = otpSection.Get<OtpSettings>() ?? new OtpSettings();
            services.AddSingleton(otpSettings);

            services.AddAuthentication(o => {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options => {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.ClaimsIssuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
                };
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = ctx =>
                    {
                        ctx.HandleResponse();
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        ctx.Response.ContentType = "application/json";

                        var localizer = ctx.HttpContext.RequestServices
                            .GetRequiredService<IStringLocalizer<Message>>();

                        var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
                        {
                            Status = StatusCodes.Status401Unauthorized,
                            Title = localizer["Error.UnauthorizedTitle"],
                            Detail = localizer["Auth.UnauthorizedDetail"],
                            Instance = ctx.Request.Path
                        };
                        problemDetails.Extensions["code"] = ErrorCode.AuthRequired;

                        return ctx.Response.WriteAsJsonAsync(problemDetails);
                    }
                };
            });
            services.AddAuthorization();
            services.AddValidatorsFromAssembly(typeof(ApplicationDependencyInjection).Assembly);
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            // Register Services
            services.AddTransient<IJwtService, JwtService>();
            services.AddScoped<IAuthTokenIssuer, AuthTokenIssuer>();
            services.AddScoped<OtpAttemptCounter>();
            return services;
        }
    }
}
