using Microsoft.AspNetCore.Components;
using Tavenem.Blazor.Framework.Services;

namespace Tavenem.Blazor.Framework.Utilities;

/// <summary>
/// Event handlers for <c>Tavenem.Blazor.Framework</c>.
/// </summary>
[EventHandler("oncrop", typeof(CropEventArgs))]
[EventHandler("ondelete", typeof(ValueChangeEventArgs))]
[EventHandler("onenter", typeof(EventArgs))]
[EventHandler("oninputtoggle", typeof(ToggleEventArgs))]
[EventHandler("onsearchinput", typeof(ValueChangeEventArgs))]
[EventHandler("onstream", typeof(StreamEventArgs))]
[EventHandler("onvaluechange", typeof(ValueChangeEventArgs))]
[EventHandler("onvalueinput", typeof(ValueChangeEventArgs))]
public static class EventHandlers;