# Changelog

## 0.8.6-preview - 0.8.7-preview
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
- LightDarkToggle initial state correctly reflects darkmode.

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
- Ensure ItemAded and ItemSaved and invoked when DataGrid.EditDialog is defined, and provide automatic item add and update on success.

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