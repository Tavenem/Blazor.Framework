using Microsoft.AspNetCore.Components;

namespace Tavenem.Blazor.Framework.DocPages.Pages.Components;

public partial class ContentsDoc : IDisposable
{
    private bool _added;
    private bool _disposedValue;

    private readonly HeadingInfo _heading = new()
    {
        Id = "dynamic-heading",
        Level = HeadingLevel.H3,
        Title = "Dynamic Heading"
    };

    [CascadingParameter] private FrameworkLayout? FrameworkLayout { get; set; }

    public void Dispose()
    {
        // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposedValue)
        {
            if (disposing && FrameworkLayout is not null && _added)
            {
                FrameworkLayout.RemoveHeading(_heading);
            }

            _disposedValue = true;
        }
    }

    private void AddHeading()
    {
        if (!_added && FrameworkLayout is not null)
        {
            FrameworkLayout.AddHeading(_heading);
            _added = true;
        }
    }

    private void RemoveHeading()
    {
        if (_added && FrameworkLayout is not null)
        {
            FrameworkLayout.RemoveHeading(_heading);
            _added = false;
        }
    }
}