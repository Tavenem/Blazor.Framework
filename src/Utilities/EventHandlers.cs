using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework.Utilities;

#if NET7_0_OR_GREATER
#else
/// <summary>
/// Event handlers for <c>Tavenem.Blazor.Framework</c>.
/// </summary>
[EventHandler("onmouseleave", typeof(MouseEventArgs), true, true)]
[EventHandler("onmouseenter", typeof(MouseEventArgs), true, true)]
public static class EventHandlers { }
#endif