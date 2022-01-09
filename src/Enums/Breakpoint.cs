namespace Tavenem.Blazor.Framework;

/// <summary>
/// Indicates one of the framework breakpoints.
/// </summary>
public enum Breakpoint
{
    /// <summary>
    /// Below 576px
    /// </summary>
    None = 0,

    /// <summary>
    /// Small: 576px - 767px
    /// </summary>
    Sm = 1,

    /// <summary>
    /// Medium: 768px - 991px
    /// </summary>
    Md = 2,

    /// <summary>
    /// Large: 992px - 1199px
    /// </summary>
    Lg = 3,

    /// <summary>
    /// eXtra Large: 1200px - 1399px
    /// </summary>
    Xl = 4,

    /// <summary>
    /// eXtra-eXtra Large: 1400px and above.
    /// </summary>
    Xxl = 5,
}
