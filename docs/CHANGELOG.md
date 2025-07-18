# Changelog

## 4.13
### Changed
- Custom editor buttons now receive richer status information.

## 4.12
### Fixed
- Respond properly to null binding change

## 4.11
### Fixed
- Prevent trimmer from removing EventArgs derived types

## 4.9-10
### Changed
- Improve tab styles when docked left or right

## 4.8
### Added
- Allow styling tabs with `TabPanel` declaration

## 4.7
### Added
- Icon tabs

## 4.6
### Changed
- Added `popup` parameter to `UtilityService.OpenUrlAsync`

## 4.5
### Fixed
- Checkbox binding

## 4.4
### Changed
- Make `placeholder` attribute responsive to binding changes

## 4.2-4.3
### Changed
- Improved `ElementList` style

## 4.1
### Fixed
- `TextInput.LoadSuggestions`

## 4.0
### Added
- `RenderFragment` support to `DialogService.Show`
### Changed
- Update to .NET 9, with multitargeting for .NET 8
- `DataGrid.AddDialog` and `DataGrid.EditDialog` now expect a `RenderFragment` and `RenderFragment<TDataItem>`, respectively, to better support AOT compilation and trimming
- `DataGrid.AddDialogParamaters` and `DataGrid.EditDialogParamaters` have been replaced by `DataGrid.AddDialogCallback` and `DataGrid.EditDialogCallback`, which do not return a value. Since the dialog properties are now `RenderFragment`s, they no longer support or require component parameters, but if you previously took advantage of these function properties to perform lazy loading of data, that behavior can be migrated to the new callbacks.
### Fixed
- `DateTime` and `DateTimeOffset` binding in `DateTimeInput`

## 3.3
### Fixed
- Missing image editor file

## 3.2
### Fixed
- Editor styles

## 3.1
### Fixed
- Select submission on select
- Tab initialization

## 3.0
### Added
- `Quality` parameter on `ImageEditor`
### Changed
- Made `Checkbox`, `ColorInput`, `DateTimeInput`, `Dropdown`, `Editor`, `EmojiInput`, `ImageEditor`, `MultiSelect`, `NumericInput`, `Pagination`, `RadioButton`, `RadioGroup`, `Rating`, `Select`, `Slider`, `Switch`, `Tabs`, `TextArea`, `TextInput`, and `Tooltip` partially compatible with static server-side rendering
  - These controls now support most use cases even on static pages, and inputs should pass their value to submitted forms
  - Data binding, validation, and other features which operate exclusively in an interactive context will still not function on statically rendered pages
- The `Editor` component has been heavily overhauled
  - WYSIWYG support has been added for [Handlebars](https://handlebarsjs.com/)
  - Syntax highlighting support has been added for Handlebars, XML, and YAML
  - Syntax support has been dropped for Less, PHP, and Sass
- `CurrentPage` in `Pagination` changed from 0-based to 1-based indexing.
### Removed
- `RenderBodyWhenClosed` on `Collapse`
- `LostFocus` and `ClearIcon` on `TextInput`
- `StepDownIcon` and `StepUpIcon` on `NumericInput`
- `FirstPageIcon`, `LastPageIcon`, `NextPageIcon`, and `PreviousPageIcon` on `Pagination`
- `AddIcon`, `BackIcon`, and `ForwardIcon` on `Tabs`
- `Icon` and `OutputHexStrings` on `ColorInput`
- `Icon` on `DateTimeInput`
- `SetModeAsync` on `Editor`
  - `EditorMode` now reacts to changes dynamically
- `Origin` on `DialogOptions`
- `FocusOut` on `Popover`
- `IsOpenChanged` on `Dropdown`
- `AddTextAsync`, `BrushColor`, `BrushSize`, `CancelAsync`, `CropAspectRatioChanged`, `DrawingMode`, `EditIcon`, `ExportImageAsync`, `FlipHorizontalAsync`, `FlipVerticalAsync`, `ImageClass`, `ImageStyle`, `RotateClockwiseAsync`, `RotateCounterClockwiseAsync`, `SetBrushColorAsync`, `SetBrushSizeAsync`, `SaveAsync`, `SetCropAspectRatioAsync` on `ImageEditor`
  - `CropAspectRatio` now reacts to changes dynamically, but is no longer bindable
- `PageClass`, `PageStyle` on `Pagination`

## 2.38
### Added
- Additional URI modifier methods to `QueryStateService`
### Fixed
- CSS import location

## 2.37
### Fixed
- List styles

## 2.36
### Changed
- Simplify build

## 2.35
### Added
- `tf-emoji` custom element which renders emoji short codes as emoji
- `EmojiInput` component which displays a picker and binds the result to an input
  - A built-in emoji button has been added to `TextInput` and `TextArea`, shown if the new `ShowEmoji` property is `true` (`false` by default)
  - A new emoji toolbar button was also added to the `Editor`
  - The new built-in emoji buttons insert the selected emoji into the input (or overwrite any selected text, in the case of the editor)
### Changed
- Default numeric format for integral `DataGrid` columns changed from `N0` to `F0`

## 2.34
### Fixed
- Collapse initial open behavior

## 2.33
### Added
- `RenderBodyWhenClosed` to `Collapse`

## 2.32
### Changed
- Field style in lists

## 2.31
### Fixed
- Pagination collapsing
- `DataGrid` pagination on filter changes

## 2.30
### Added
- `ShowAllSuggestions` property to `TextInput`
### Changed
- Made only dialog header a drag control, to avoid interfering with controls in the dialog.

## 2.29
### Changed
- Fields no longer have `flex-grow` set to 1 by default

## 2.28
### Fixed
- Tree style

## 2.27
### Fixed
- Dialog style

## 2.26
### Fixed
- Contents behavior

## 2.25
### Fixed
- Input style regression

## 2.24
### Fixed
- Font fallback

## 2.23
### Added
- `tf-accordion` custom element (replacement for `Accordion` component which does not require interactivity)
### Changed
- Reimplemented Collapse with `details` and `summary` HTML elements, no longer requires interactivity for basic functionality
  - `IsOpen` parameter of Collapse split into `IsOpen` public property for current state and `IsInitiallyOpen` parameter for initial state
  - `OnOpening` callback now invoked after state change, rather than before
- Implemented CSS cascade layers for the framework's CSS
- It is no longer necessary to include the framework's CSS stylesheet manually. This is now handled automatically.
### Removed
- `Accordion` component (replaced with `tf-accordion` custom HTML element)
- `OnIsOpenChanged` event from `Collapse`
- `TitleIsToggle` property from `Collapse` (always true with new `details`+`summary` implementation)

## 2.22
### Fixed
- Nested popovers

## 2.21
### Fixed
- Null exception

## 2.20
### Changed
- Sublist style fix

## 2.19
### Changed
- Improve popover list sizing

## 2.18
### Fixed
- Contents links

## 2.17
### Changed
- Enable non-global interactivity for dialogs and snackbars
### Removed
- `DismissAllDialogs` method on `FrameworkLayout` (necessary to enable interactivity for the `DialogContainer`)

## 2.16
### Fixed
- Popover placement in offset containers

## 2.15
### Changed
- Improve popover placement

## 2.14
### Fixed
- Dropdown interactivity

## 2.13
### Fixed
- Editor buttons

## 2.12
### Fixed
- Drawer toggle

## 2.11
### Fixed
- Grouped paging in DataGrid

## 2.10
### Changed
- CSS file no longer auto-injected into head, enabling easier overrides

## 2.9
### Fixed
- Fixed change detection

## 2.8
### Fixed
- Fixed change notification

## 2.7
### Changed
- Notify any containing `EditContext` when a `FormComponent` has its `Value` changed externally

## 2.6
### Fixed
- Tabs

## 2.5
### Changed
- Do not present persistence links for stateful components when not interactive and not opted into persistence (e.g. when prerendering). Instead, show the component in a disabled state.

## 2.4
### Changed
- Restore `tf-syntax-highlight` to previous behavior of `SyntaxHighlighter`: operate separately on all nested `pre code` elements, rather than the whole element content

## 2.3
### Fixed
- `DataGrid` column filtering

## 2.2
### Added
- More manual control properties to `Steps`

## 2.1
### Fixed
- Trim issues
- Image Editor display bug

## 2.0
### Added
- Trimming and AOT compatibility
- Close button `auto` attribute, which allows automatically closing a parent element with the `data-can-close` attribute
- `Collapse.NavUrl` and `Collapse.NavLinkMatch` to enable auto-open based on `NavLink`-style logic
- Added properties to `Contents` to improve customizability:
   - `MaxLevel`
   - `MaxLevelOffset`
   - `MinHeadings`
- `DialogContainer` to support use of dialogs without the `FrameworkLayout`  
- `DrawerToggle` placeable button to automatically control a drawer
- `Drawer.ShowAtBreakpoint` and `Drawer.HideAtBreakpoint`
- `MarkdownRenderer` component
- `SnackbarContainer` to support use of snackbars without the `FrameworkLayout`
- More manual control properties and methods to `Steps`
- `tf-scroll-top` custom element (replacement for `ScrollToTop` component)
- `tf-syntax-highlight` custom element (replacement for `SyntaxHighlighter` component)
### Changed
- Update to .NET 8
- Adds support for prerendering and static render mode
- Use Material Symbols instead of Material Icons
- Added `ChildContent` outlet for most components where it was missing
- `AppBar` component replaced by simple CSS class (built-in drawer functionality replaced by `DrawerToggle`)
- `Tooltip` component drastically changed
   - No longer wraps an anchor component
   - Any element can now reference a `Tooltip` by its `Id` with a `data-tooltip-id` HTML attribute
   - A `Tooltip` nested inside an element is automatically associated with that element, unless `IsContainerTrigger` is set to `false`
   - All properties for specifying the content of the tooltip have been dropped
   - The `ChildContent` specifies the content of the tooltip popover
   - Removed no-hover icons
   - Added `IsButton` property to explicitly specify when to display an icon button to act as the trigger
### Fixed
- Grouped paging in DataGrid
- Added field flex grow
- Tab scrolling
- Data grid loading behavior
- Improved `Tooltip` behavior
### Removed
- .NET 6 and .NET 7 targets
- `AnchorLink` (replaced by native fragment handling and built-in Collapse NavLink functionality)
- `Drawer.BeforeClosing`, `IsOpen`, `IsOpenChanged`. These were never reliable due to breakpoint and navigation automatic behavior.
- `Drawer.Breakpoint` (replaced by `Drawer.ShowAtBreakpoint` and `Drawer.HideAtBreakpoint`)
- `Dropdown.TriggerContent`
- `Heading` component (`Contents` now works with standard HTML headings, and any element with the `tav-heading` CSS class)
- `LightDarkToggle` component (replaced by `tf-darkmode-toggle` custom HTML element)
- `ScrollService.ScrollSpyTags` (`ScrollService.ScrollSpy` now accepts a CSS selector rather than a class name only)
- `ScrollToTop` (replaced by `tf-scroll-top` custom element)
- `SyntaxHighlighter` (replaced by `tf-syntax-highlight` custom element)
- `ThemeService` (replaced by `tf-darkmode-toggle` custom HTML element and built-in features, in order to fully support static and prerendering)
- `Timeline` component (`div` with `timeline` CSS class provides all the same functionality)

## 1.49
### Fixed
- `DataGridColumnAttribute.IsShown`

## 1.48
### Added
- `ColumnOrder` to `DataGrid` columns
- `DataGridColumnAttribute` attribute, which can be used to configure column properties when auto-generating `DataGrid` columns
- `System.ComponentModel.DataAnnotations` attribute support for certain column properties when auto-generating `DataGrid` columns

## 1.47
### Changed
- Editor selection and read-only improvements

## 1.46
### Fixed
- Image crop aspect ratios

## 1.45
### Changed
- Image auto-scale for editor to prevent drastic UI scaling

## 1.44
### Changed
- Add top margin to contents to match main

## 1.43
### Fixed
- Dark theme persistence when light theme is the browser default

## 1.42
### Fixed
- `Src` change in `ImageEditor`

## 1.41
### Fixed
- Image sizing in `ImageEditor`

## 1.40
### Fixed
- Canvas resizing in `ImageEditor`

## 1.39
### Changed
- Fit image in `ImageEditor`

## 1.38
### Fixed
- `BeginEditAsync` in `ImageEditor`

## 1.37
### Changed
- Improved `ImageEditor` stream handling

## 1.36
### Fixed
- List item clicking

## 1.34-35
### Changed
- Class, property, and method accessibility changes

## 1.33
### Changed
- Text editing enabled for `DateTimeInput`

## 1.32
### Fixed
- Editor lists

## 1.31
### Fixed
- Editor clear

## 1.30
### Fixed
- Enable scroll spy for manual headings

## 1.29
### Fixed
- Headings

## 1.28
### Added
- Manual headings

## 1.27
### Fixed
- Inline radio options

## 1.26
### Fixed
- Editor dialogs update on input

## 1.25
### Fixed
- Collapsible list item improvements
### Changed
- Adjust outlined form styles

## 1.24
### Fixed
- Enable selection of collapsible list items

## 1.23
### Changed
- Adjust nested list styles

## 1.22
### Changed
- Adjust nested list styles in popovers

## 1.21
### Changed
- Adjust nested list styles

## 1.20
### Changed
- Adjust list drag styles

## 1.19
### Changed
- Improved keyboard navigation in `DataGridSelect`
- Gave auto edit dialogs for `DataGrid` a minimum width

## 1.18
### Changed
- `DataGrid` quick search larger

## 1.17
### Fixed
- Added `StateHasChanged` invocation on `DataGrid` row edit/delete

## 1.16
### Added
- Column mapping support for `DataGridRequest`

## 1.15
### Changed
- Improved keyboard navigation for various controls

## 1.14
### Fixed
- Enable persistent `DataGrid` state when explicit columns are used

## 1.13
### Added
- `DataGrid` components with an explicit `Id` will now persist paging, filter, and sort information between in-app page navigations
### Changed
- Values in a `DataGrid` select component with `LoadItems` defined can now be selected even when not present in the currently loaded page

## 1.12
### Changed
- Improve Steps styles

## 1.11
### Changed
- Allow cascading `CollapsibleTemplate` from parent `ElementList` components

## 1.10
### Added
- Add `Clicked` handler to `TimelineItem`

## 1.9
### Added
- Optional `DialogOptions` for the `AddDialog` and `EditDialog` of `DataGrid`

## 1.8
### Changed
- Add slight delay to setting `IsTouched` on inputs, to avoid a flash of invalid style
### Fixed
- Input controls now respond to dynamic changes to the `Required` property
- `DateTimeInput` navigation bug

## 1.7
### Fixed
- `DataGrid` page count

## 1.6
### Changed
- Select input style tweaks

## 1.5
### Fixed
- `DataGrid` paging when grouped or filtered

## 1.4
### Changed
- Minor style fix for alerts

## 1.4-preview1
### Changed
- Improve form validation for required fields

## 1.3
### Fixed
- `DateTimeInput` year navigation bug
- `MultiSelect` behavior

## 1.2
### Changed
- Improve form validation for required fields

## 1.1
### Changed
- Do not use `codeblock` class on entire SyntaxHighlighter

## 1.0
First stable release

### Added
- SyntaxHighlighter component
### Changed
- Update to .NET 7

## 0.12.5-preview
### Changed
- Reposition popovers on refresh to ensure layout changes haven't invalidated previously calculated position

## 0.12.4-preview
### Fixed
- Change retention of object URLs for image editor, to enable re-editing

## 0.12.3-preview
### Fixed
- Revoke object URL called when no URL was provisioned

## 0.12.2-preview
### Fixed
- Prevented image editor from entering edit mode when loading an image from a stream

## 0.12.1-preview
### Added
- Additional bindable properties and callbacks for image editor

## 0.12.0-preview
### Added
- Image editor

## 0.11.8-preview-0.11.9-preview
### Fixed
- Event support for .NET 6

## 0.11.7-preview
### Added
- `OnValidEnter` callback to `TextInput`
### Changed
- Update to .NET 7 RC 2

## 0.11.6-preview
### Added
- `OutputHexStrings` property to `ColorInput`

## 0.11.5-preview
### Added
- `DismissOnTap` property to tooltips
### Fixed
- Button group styling
- Behavior of mobile tooltip icon
### Changed
- Tooltips are dismissed when interacting with the underlying element

## 0.11.4-preview
### Fixed
- Tooltip delay
### Changed
- Apply theme color to color and date picker buttons

## 0.11.3-preview
### Fixed
- Button group style for tooltips

## 0.11.2-preview
### Changed
- Hide clear icon instead of remove it in clearable inputs, to prevent width changes

## 0.11.1-preview
### Changed
- Made some extension methods public:
  - `ToHtmlId` (`Guid`) - format suitable for use as an HTML id
  - `ToHumanReadable` (`string` or `Enum`): replaces '_' with ' ' and inserts spaces into `camelCase` and `PascalCase` terms
  - `ToCSS` (`Enum`): formats in lowercase, replaces '_' with '-'
  - `ToCSS` (floating point types): formats in the most compact notation suitable for a CSS property value
  - `ToPixels` (floating point types): as `ToCss`, followed by "px"

## 0.11.0-preview
### Added
- `Size` to `TextInput`, `NumericInput`, `Select`, `MultiSelect`, `DataGridSelect`, and `DataGridMultiSelect`: specify the minimum width of the inner input control in displayed characters
- `OptionSize` to `Select` and `MultiSelect` to calculate size for templated options
- [`Nerdbank.GitVersioning`](https://github.com/dotnet/Nerdbank.GitVersioning)
### Changed
- Removed minimum width for most input controls
- Minimum width for selects calculated automatically in most situations

## 0.10.11-preview
### Changed
- Removed top margin from form controls when there is no label

## 0.10.9-preview - 0.10.10-preview
### Fixed
- Fix build

## 0.10.8-preview
### Added
- `HelpTextContent` added to `InputComponentBase`, which overrides `HelpText` if provided
### Changed
- Update to .NET 7 RC 1.

## 0.10.7-preview
### Changed
- Preserve collapse child padding

## 0.10.6-preview
### Changed
- Collapse body form fields align stretch

## 0.10.5-preview
### Changed
- Collapse body align start

## 0.10.4-preview
### Fixed
- Light/dark theme persistence.

## 0.10.3-preview
### Changed
- Disable library trimming; too many unidentified (de)serialized objects needed for JS interop.

## 0.10.2-preview
### Fixed
- Dependency update, fix broken dependency chain.

## 0.10.1-preview
### Fixed
- Field style.

## 0.10.0-preview
### Changed
- Enable library trimming.
- Removed default getter and setter implementations from InputValueConverter. These relied on reflection of unknown types and were unsuited to trimming.

## 0.9.2-preview
### Fixed
- Card styles.

## 0.9.1-preview
### Changed
- Update to .NET 7 preview 7.
- Update dependencies.

## 0.9.0-preview
### Fixed
- Removed required attribute from hidden inputs.
### Changed
- Disable browser validation in Forms by default.

## 0.8.6-preview - 0.8.9-preview
### Fixed
- Pagination focus.

## 0.8.5-preview
### Fixed
- Column filtering on initially hidden columns.
- Load async items after column filtering.

## 0.8.4-preview
### Fixed
- Column initial sorting in DataGridSelects.

## 0.8.3-preview
### Fixed
- Form with explicitly null `EditContext`.

## 0.8.2-preview
### Fixed
- Popover placement within dialogs.

## 0.8.1-preview
### Fixed
- Setting editor value in HTML WYSIWYG mode.

## 0.8.0-preview
### Changed
- Initially sorted columns are included in sort order, even when hidden.

## 0.7.11-preview
### Fixed
- Disposed object exceptions on timers.

## 0.7.10-preview
### Fixed
- Null references on disposed timers.

## 0.7.9-preview
### Changed
- Give dialogs flat background.

## 0.7.8-preview
### Fixed
- External ElementList changes.

## 0.7.7-preview
### Fixed
- Dialog title.

## 0.7.6-preview
### Added
- ElementList.GetItemDragData.

## 0.7.5-preview
### Fixed
- Dragging custom types.

## 0.7.4-preview
### Fixed
- Display initially shown inline dialogs.
- Drag not working in focus traps.

## 0.7.3-preview
### Changed
- Drag indicator for list items.

## 0.7.2-preview
### Fixed
- Collapsible & draggable list items.

## 0.7.1-preview
### Fixed
- DataGrid bool filter behavior.

## 0.7.0-preview
### Changed
- Make DataGrid TDataItem type nullable.

## 0.6.0-preview
### Changed
- Multitarget .NET 6 and 7-preview.
- Remove dependency on framework InputBase.
### Fixed
- Select option correctly clears selection icon after clear.

## 0.5.27-preview
### Fixed
- DataGrid async pagination behavior fixed.
- DataGrid async quick filtering now works on hidden columns.

## 0.5.26-preview
### Fixed
- DataGrid async loading quick filter fixed.
- Dialog style fixes.
- Improve popover behavior

## 0.5.25-preview
### Changed
- Minor style change to form controls within tables.

## 0.5.24-preview
### Fixed
- Extracted internal Dialogs to separate components to avoid nesting dialog problem.

## 0.5.23-preview
### Changed
- Updated icon.

## 0.5.22-preview
### Changed
- Harden JS Interop calls.

## 0.5.21-preview
### Changed
- Improved keyboard navigation within selects.
- Preserve focus after pagination operations.

## 0.5.20-preview
### Fixed
- DataGrid: columns with unsupported types no longer filtered.

## 0.5.19-preview
### Fixed
- Correct height and width attribute for img in Editor.

## 0.5.18-preview
### Changed
- Max height for dialogs.

## 0.5.17-preview
### Changed
- Update to .NET 7 preview 6.

## 0.5.16-preview
### Fixed
- MultiSelect binding.

## 0.5.15-preview
### Fixed
- Tabs.ActivePanelIndexChanged fires as expected.

## 0.5.14-preview
### Changed
- Align content to start in card body.

## 0.5.13-preview
### Added
- Editor.SetModeAsync
### Changed
- Editor.EditorMode now sets initial state only.

## 0.5.12-preview
### Changed
- Style changes.
- LightDarkToggle state saved to localStorage when different from system preference.

## 0.5.11-preview
### Changed
- Removed extraneous files from package.

## 0.5.10-preview
### Added
- Added README to NuGet.

## 0.5.9-preview
### Changed
- Adjusted default styles for containers.

## 0.5.8-preview
### Added
- MaxWidth for Popover
### Changed
- Select Popover anchored to bottom-left, instead of center.

## 0.5.7-preview
### Changed
- More style improvements.

## 0.5.6-preview
### Changed
- Improved styles.

## 0.5.5-preview
### Fixed
- Initial int filters on DataGrid fixed.
### Changed
- Clearer message when DataGrid has no items because of filtering.

## 0.5.4-preview
### Added
- Initial sort for DataGrid columns.

## 0.5.3-preview
### Fixed
- Asynchronous DataGrid loading.

## 0.5.2-preview
### Fixed
- Refresh after loading DataGrid items asynchronously.
- Icon display priority.
- LightDarkToggle initial state correctly reflects dark mode.

## 0.5.1-preview
### Fixed
- Initial bool filters on DataGrid fixed.
### Changed
- Selects now have a max height.

## 0.5.0-preview
### Added
- Steps component.

## 0.4.6-preview
### Fixed
- Codeblock does not disable child scroll.

## 0.4.5-preview
### Fixed
- Fix TextArea ignoring Rows parameter.

## 0.4.4-preview
### Added
- Use AddDialog as intended.

## 0.4.3-preview
### Added
- AddDialog for DataGrid.

## 0.4.2-preview
### Added
- Initial filter for DataGrid Column.

## 0.4.1-preview
### Changed
- Improve List drag-drop.

## 0.4.0-preview
### Changed
- Added RowValue to DataGridSelect and DataGridMultiSelect.

## 0.3.3-preview
### Fixed
- Improve Select keyboard behavior.

## 0.3.2-preview
### Fixed
- Removed circular TypeScript import.

## 0.3.1-preview
### Changed
- Ensure ItemAdded and ItemSaved and invoked when DataGrid.EditDialog is defined, and provide automatic item add and update on success.

## 0.3.0-preview
### Changed
- DataGrid.EditDialogParameters is now asynchronous, and receives the edited item

## 0.2.0-preview
### Added
- Allow passing parameters to the edit dialog for DataGrid

## 0.1.1-preview
### Changed
- Update to .NET 7 preview 5

## 0.1.0-preview
### Added
- Initial preview release