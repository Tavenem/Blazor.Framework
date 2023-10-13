using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services.Popovers;

namespace Tavenem.Blazor.Framework.Utilities;

/// <summary>
/// Event handlers for <c>Tavenem.Blazor.Framework</c>.
/// </summary>
[EventHandler("onfocuslost", typeof(EventArgs))]
[EventHandler("dropdowntoggle", typeof(DropdownToggleEventArgs))]
public static class EventHandlers { }