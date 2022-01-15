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
		<h5><a href="""" class=""text-reset"">Main Title</a></h5>
		<LightDarkToggle class=""justify-self-end"" />
	</AppBar>
	<Drawer Side=""Side.Left"">
		<div class=""list"" role=""navigation"">
			<NavLink href="""" Match=""NavLinkMatch.All""><span class=""icon home"" /> Home</NavLink>
			<NavLink href=""./counter""><span class=""icon pin"" /> Counter</NavLink>
			<NavLink href=""./fetchdata""><span class=""icon leaderboard"" /> Fetch data</NavLink>
		</div>
	</Drawer>
    <div class=""d-flex"">
        <main class=""flex-grow-1"">
            @Body
        </main>
        <Contents Breakpoint=""Breakpoint.Lg"" />
    </div>
</FrameworkLayout>";
}