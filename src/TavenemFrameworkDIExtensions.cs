﻿using Tavenem.Blazor.Framework;
using Tavenem.Blazor.Framework.Services;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Extension to <c>Microsoft.Extensions.DependencyInjection</c> for
/// <c>Tavenem.Blazor.Framework</c>.
/// </summary>
public static class TavenemFrameworkDIExtensions
{
    /// <summary>
    /// Add the required services for <c>Tavenem.Blazor.Framework</c>.
    /// </summary>
    /// <param name="services">Your <see cref="IServiceCollection"/> instance.</param>
    /// <returns>The <see cref="IServiceCollection"/> instance.</returns>
    public static IServiceCollection AddTavenemFramework(this IServiceCollection services)
    {
        services.AddScoped<AppState>();
        services.AddScoped<UtilityService>();
        services.AddScoped<ContentsService>();
        services.AddScoped<DragDropService>();
        services.AddScoped<PopoverService>();
        services.AddScoped<ScrollService>();
        services.AddScoped<ThemeService>();
        services.AddScoped<DialogService>();
        services.AddScoped<SnackbarService>();
        services.AddTransient<DragDropListener>();
        services.AddTransient<EditorService>();
        services.AddTransient<IJSEventListener, JSEventListener>();
        services.AddTransient<IKeyListener, KeyListener>();
        services.AddTransient<IResizeObserver, ResizeObserver>();
        services.AddTransient<ScrollListener>();
        return services;
    }
}
