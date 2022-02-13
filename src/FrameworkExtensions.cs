using Tavenem.Blazor.Framework;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Extension to <c>Microsoft.Extensions.DependencyInjection</c> for
/// <c>Tavenem.Blazor.Framework</c>.
/// </summary>
public static class FrameworkExtensions
{
    /// <summary>
    /// Add the required services for <c>Tavenem.Blazor.Framework</c>.
    /// </summary>
    /// <param name="services">Your <see cref="IServiceCollection"/> instance.</param>
    /// <returns>The <see cref="IServiceCollection"/> instance.</returns>
    public static IServiceCollection AddTavenemFramework(this IServiceCollection services)
    {
        services.AddScoped<FrameworkJsInterop>();
        services.AddTransient<IKeyListener, KeyListener>();
        services.AddTransient<ScrollListener>();
        return services;
    }
}
