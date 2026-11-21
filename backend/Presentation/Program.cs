using System.Globalization;
using System.Threading.RateLimiting;
using Application.Interfaces.Database;
using Domain.Errors;
using Domain.Resources;
using Infrastructure;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Localization;
using Presentation.Extensions;
using Presentation.Middlewares;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddLocalization();
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { new CultureInfo("vi"), new CultureInfo("en") };
    options.DefaultRequestCulture = new RequestCulture("vi");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
    options.RequestCultureProviders =
    [
        new AcceptLanguageHeaderRequestCultureProvider(),
        new QueryStringRequestCultureProvider()
    ];
});

builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

builder.Services.AddApiRateLimiter();
builder.Services.AddHttpContextAccessor();
builder.Services.AddDependencyInjection(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
    [
        "application/json",
        "application/problem+json",
        "text/plain"
    ]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var localizer = context.HttpContext.RequestServices.GetRequiredService<IStringLocalizer<Message>>();
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = ReasonPhrases.GetReasonPhrase(StatusCodes.Status400BadRequest),
            Detail = localizer["Error.ValidationFailed"].Value,
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["code"] = ErrorCode.ValidationFailed;

        return new BadRequestObjectResult(problem)
        {
            ContentTypes = { "application/problem+json" }
        };
    };
});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    await initializer.MigrateAsync();
}

app.UseRequestLocalization();
app.UseResponseCompression();

app.Use((context, next) =>
{
    context.Request.EnableBuffering();
    return next(context);
});

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseRateLimiter();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
