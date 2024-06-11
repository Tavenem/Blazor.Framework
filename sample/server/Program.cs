using Tavenem.Blazor.Framework;
using Tavenem.Blazor.Framework.Sample.Components;

const string DevStartUrl = "/components/datetime-input";// "/test";

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

builder.Services.AddTavenemFramework();
builder.Services.ConfigureHttpJsonOptions(options
    => options.SerializerOptions.TypeInfoResolverChain.Insert(
        0,
        TavenemFrameworkJsonSerializerContext.Default));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(
        typeof(Tavenem.Blazor.Framework.DocPages.Utilities.CodeFormatter).Assembly,
        typeof(Tavenem.Blazor.Framework.Sample.Client._Imports).Assembly);

if (app.Environment.IsDevelopment())
{
    app.MapGet("/dev", () => Results.LocalRedirect(DevStartUrl));
}

app.Run();
