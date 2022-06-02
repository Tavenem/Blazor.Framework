using System.Diagnostics;
using System.Text;

namespace Tavenem.Blazor.Framework.Services;

internal class SnackbarProperties
{
    public static readonly TimeSpan ShowDuration = TimeSpan.FromMilliseconds(250);
    public static readonly TimeSpan HideDuration = TimeSpan.FromSeconds(1);

    public string? Class => new CssBuilder("snackbar")
        .Add(Options.ThemeColor.ToCSS())
        .Add("clickable", Options.OnClick is not null)
        .ToString();

    public SnackbarOptions Options { get; }

    public SnackbarState State { get; set; }

    public Stopwatch Stopwatch { get; } = new();

    public string? Style
    {
        get
        {
            if (State is not SnackbarState.Showing
                and not SnackbarState.Hiding)
            {
                return null;
            }

            var sb = new StringBuilder("animation: ");
            if (State == SnackbarState.Showing)
            {
                sb.Append(AnimationMilliseconds(ShowDuration));
            }
            else
            {
                sb.Append(AnimationMilliseconds(HideDuration));
            }
            sb.Append("ms linear ")
                .Append(Id)
                .Append(';');

            return sb.ToString();
        }
    }

    public string? TransitionClass
    {
        get
        {
            if (State is not SnackbarState.Showing
                and not SnackbarState.Hiding)
            {
                return null;
            }

            var sb = new StringBuilder("@keyframes ")
                .Append(Id)
                .Append(" {from{ opacity:");

            switch (State)
            {
                case SnackbarState.Showing:
                    sb.Append('0');
                    break;
                case SnackbarState.Hiding:
                    sb.Append(".95");
                    break;
            }

            sb.Append("; } to{ opacity:");

            switch (State)
            {
                case SnackbarState.Showing:
                    sb.Append(".95");
                    break;
                case SnackbarState.Hiding:
                    sb.Append('0');
                    break;
            }

            return sb.Append("; }}")
                .ToString();
        }
    }

    public bool UserInteracted { get; set; }

    private string Id { get; }

    public SnackbarProperties(SnackbarOptions options)
    {
        Id = $"snackbar-{Guid.NewGuid():N}";
        Options = options;
        State = SnackbarState.Initializing;
    }

    private int AnimationMilliseconds(TimeSpan duration)
    {
        var delta = duration - Stopwatch.Elapsed;
        return delta >= TimeSpan.Zero
            ? (int)Math.Round(delta.TotalMilliseconds)
            : 0;
    }
}
