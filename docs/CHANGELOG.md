# Changelog

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