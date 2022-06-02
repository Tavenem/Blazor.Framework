using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Reports touch interactions, including pinch and swipe.
/// </summary>
public partial class TouchTarget
{
    private int? _maxTouches, _minTouches;
    private double? _xDownMax, _xDownMin, _xMax, _xMin, _xMaxLast, _xMinLast,
        _yDownMax, _yDownMin, _yMax, _yMin, _yMaxLast, _yMinLast;

    /// <summary>
    /// Invoked when a pinch occurs.
    /// </summary>
    /// <remarks>
    /// <para>
    /// If a touch event occurs but neither point traverses a significant area in any direction, it
    /// is not counted as a punch and this event is not raised, to avoid interpreting touches
    /// (possibly with some minimal "smudging") as pinches.
    /// </para>
    /// <para>
    /// If the total pinch includes significant motion in both inward and outward directions, the
    /// callback is not invoked, interpreting the user's interaction as either uncertain, or as a
    /// deliberate attempt to cancel the interaction.
    /// </para>
    /// </remarks>
    [Parameter] public EventCallback<PinchEventArgs> OnPinch { get; set; }

    /// <summary>
    /// Invoked when a swipe occurs.
    /// </summary>
    /// <remarks>
    /// <para>
    /// If a touch event occurs but does not traverse a significant area in any direction, it is not
    /// counted as a swipe and this event is not raised, to avoid interpreting touches (possibly
    /// with some minimal "smudging") as swipes.
    /// </para>
    /// <para>
    /// If the total swipe includes significant motion in every direction, the callback is not
    /// invoked, interpreting the user's interaction as either uncertain, or as a deliberate attempt
    /// to cancel all motion by reversing course.
    /// </para>
    /// </remarks>
    [Parameter] public EventCallback<SwipeEventArgs> OnSwipe { get; set; }

    /// <inheritdoc />
    protected override string? CssStyle => new CssBuilder("touch-action:none")
        .AddStyle(Style)
        .AddStyleFromDictionary(AdditionalAttributes)
        .ToString();

    private void OnTouchCancel(TouchEventArgs e) => Reset();

    private async Task OnTouchEndAsync(TouchEventArgs e)
    {
        if (!_minTouches.HasValue
            || !_maxTouches.HasValue
            || !_xDownMin.HasValue
            || !_xDownMax.HasValue
            || !_yDownMin.HasValue
            || !_yDownMax.HasValue
            || !_xMin.HasValue
            || !_xMax.HasValue
            || !_yMin.HasValue
            || !_yMax.HasValue)
        {
            return;
        }

        double xEnd, deltaX, yEnd, deltaY;
        if (e.Touches.Length == 0)
        {
            xEnd = _xMaxLast ?? _xDownMax.Value;
            yEnd = _yMaxLast ?? _yDownMax.Value;
        }
        else
        {
            xEnd = e.Touches.Max(x => x.ClientX);
            yEnd = e.Touches.Max(x => x.ClientY);
        }
        deltaX = xEnd - _xDownMin.Value;
        deltaY = yEnd - _yDownMin.Value;

        if (Math.Abs(deltaX) < 10
            && Math.Abs(deltaY) < 10)
        {
            Reset();
            return;
        }

        var leftRightDirection = SwipeDirection.None;
        if (deltaX > 10)
        {
            if (_xMax - xEnd < 100)
            {
                leftRightDirection = SwipeDirection.Right;
            }
        }
        else if (deltaX < -10 && xEnd - _xMin < 10)
        {
            leftRightDirection = SwipeDirection.Left;
        }

        var upDownDirection = SwipeDirection.None;
        if (deltaY > 10)
        {
            if (_yMax - yEnd < 10)
            {
                upDownDirection = SwipeDirection.Down;
            }
        }
        else if (deltaY < -10 && yEnd - _yMin < 10)
        {
            upDownDirection = SwipeDirection.Up;
        }

        var direction = leftRightDirection | upDownDirection;

        if (direction == SwipeDirection.None)
        {
            Reset();
            return;
        }

        await OnSwipe.InvokeAsync(new()
        {
            Direction = direction,
            Touches = _maxTouches.Value,
        });
        Reset();
    }

    private async Task OnTouchMoveAsync(TouchEventArgs e)
    {
        var currentTouches = e.Touches.Length;
        if (currentTouches == 0)
        {
            return;
        }

        _minTouches = Math.Min(_minTouches ?? 0, currentTouches);
        _maxTouches = Math.Max(_maxTouches ?? 0, currentTouches);

        var xMinNow = e.Touches.Min(x => x.ClientX);
        _xMin = Math.Min(_xMin ?? int.MaxValue, xMinNow);
        var xMaxNow = e.Touches.Max(x => x.ClientX);
        _xMax = Math.Max(_xMax ?? int.MinValue, xMaxNow);

        var yMinNow = e.Touches.Min(x => x.ClientY);
        _yMin = Math.Min(_yMin ?? int.MaxValue, yMinNow);
        var yMaxNow = e.Touches.Max(x => x.ClientY);
        _yMax = Math.Max(_yMax ?? int.MinValue, yMaxNow);

        var significantDelta = _xMinLast.HasValue
            && _xMaxLast.HasValue
            && _yMinLast.HasValue
            && _yMaxLast.HasValue
            && (Math.Abs(_xMinLast.Value - xMinNow) >= 100
            || Math.Abs(_xMaxLast.Value - xMaxNow) >= 100
            || Math.Abs(_yMinLast.Value - yMinNow) >= 100
            || Math.Abs(_yMaxLast.Value - yMaxNow) >= 100);

        _xMinLast = xMinNow;
        _xMaxLast = xMaxNow;
        _yMinLast = yMinNow;
        _yMaxLast = yMaxNow;

        if (!significantDelta
            || _minTouches < 2
            || !_xDownMin.HasValue
            || !_xDownMax.HasValue
            || !_yDownMin.HasValue
            || !_yDownMax.HasValue)
        {
            return;
        }

        var deltaXMin = _xMinLast.Value - xMinNow;
        var deltaXMax = _xMaxLast.Value - xMaxNow;

        var deltaYMin = _yMinLast.Value - yMinNow;
        var deltaYMax = _yMaxLast.Value - yMaxNow;

        var deltaMin = Math.MaxMagnitude(deltaXMin, deltaYMin);
        var deltaMax = Math.MaxMagnitude(deltaXMax, deltaYMax);

        if (Math.Sign(deltaMin) == Math.Sign(deltaMax)
            || (Math.Abs(deltaMin) < 100
            && Math.Abs(deltaMax) < 100))
        {
            return;
        }

        await OnPinch.InvokeAsync(new()
        {
            Inward = deltaMin >= 0,
            Touches = currentTouches,
        });
    }

    private void OnTouchStart(TouchEventArgs e)
    {
        _minTouches = e.Touches.Length;
        _maxTouches = _minTouches;

        _xDownMin = _xMin = e.Touches.Min(x => x.ClientX);
        _xDownMax = _xMax = e.Touches.Max(x => x.ClientX);

        _yDownMin = _yMin = e.Touches.Min(x => x.ClientY);
        _yDownMax = _yMax = e.Touches.Max(x => x.ClientY);
    }

    private void Reset()
    {
        _maxTouches = null;
        _xDownMin = null;
        _xDownMax = null;
        _xMax = null;
        _xMin = null;
        _yDownMin = null;
        _yDownMax = null;
        _yMax = null;
        _yMin = null;
    }
}