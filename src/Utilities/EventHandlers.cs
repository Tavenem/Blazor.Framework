using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.Utilities;

/// <summary>
/// Event handlers for <c>Tavenem.Blazor.Framework</c>.
/// </summary>
[EventHandler("delete", typeof(ValueChangeEventArgs))]
[EventHandler("enter", typeof(EventArgs))]
[EventHandler("searchinput", typeof(ValueChangeEventArgs))]
[EventHandler("inputtoggle", typeof(ToggleEventArgs))]
[EventHandler("valuechange", typeof(ValueChangeEventArgs))]
[EventHandler("valueinput", typeof(ValueChangeEventArgs))]
public static class EventHandlers;