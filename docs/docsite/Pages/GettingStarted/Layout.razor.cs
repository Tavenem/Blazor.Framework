namespace Tavenem.Blazor.Framework.Docs.Pages.GettingStarted;

public partial class Layout
{
    private const string _example1 =
@"<FrameworkLayout>
    @Body
</FrameworkLayout>";
    private const string _example2 =
@"<FrameworkLayout ThemeColor=""ThemeColor.Primary"">
	<AppBar Side=""VerticalSide.Top"" ControlsDrawerSide=""Side.Left"">
        <span class=""primary text-close"" style=""font-size:2em;cursor:pointer"" @onclick=""Home"">Main Title</span>
		<LightDarkToggle class=""ms-auto"" />
	</AppBar>
	<Drawer Side=""Side.Left"">
		<div class=""list"" role=""navigation"">
			<NavLink href="""" Match=""NavLinkMatch.All""><span class=""icon home"" /> Home</NavLink>
			<NavLink href=""./counter""><span class=""icon pin"" /> Counter</NavLink>
			<NavLink href=""./fetchdata""><span class=""icon leaderboard"" /> Fetch data</NavLink>
		</div>
	</Drawer>
    <div class=""d-flex"">
        <main class=""container mt-3"">
            @Body
        </main>
        <Contents Breakpoint=""Breakpoint.Lg"" />
    </div>
</FrameworkLayout>";
}