﻿using Microsoft.AspNetCore.Components;
using System.Diagnostics.CodeAnalysis;

namespace Tavenem.Blazor.Framework;

/// <summary>
/// Show and manage dialog windows.
/// </summary>
public class DialogService
{
    internal event Action<DialogReference>? OnDialogAdded;
    internal event Action<DialogReference, DialogResult?>? OnDialogClosed;

    /// <summary>
    /// Close the given dialog.
    /// </summary>
    /// <param name="dialog">The dialog to close.</param>
    /// <param name="result">
    /// <para>
    /// An optional <see cref="DialogResult"/> to submit as the result of the dialog.
    /// </para>
    /// <para>
    /// If left <see langword="null"/>, a Cancel result will be supplied.
    /// </para>
    /// </param>
    public void Close(DialogReference dialog, DialogResult? result = null)
        => OnDialogClosed?.Invoke(dialog, result);

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <param name="renderFragment">
    /// The <see cref="RenderFragment"/> to display as a dialog.
    /// </param>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show(
        RenderFragment renderFragment,
        string? title = null,
        DialogOptions? options = null)
    {
        var reference = new DialogReference(this);
        var instance = new RenderFragment(builder =>
        {
            builder.OpenComponent<DialogInstance>(0);
            builder.SetKey(reference.Id);
            builder.AddAttribute(1, nameof(DialogInstance.Id), reference.Id);
            builder.AddAttribute(2, nameof(DialogInstance.Options), options ?? new());
            builder.AddAttribute(3, nameof(DialogInstance.Title), title);
            builder.AddAttribute(4, nameof(DialogInstance.ChildContent), renderFragment);
            builder.CloseComponent();
        });
        reference.InjectRenderFragment(instance);

        OnDialogAdded?.Invoke(reference);

        return reference;
    }

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <param name="renderFragment">
    /// The <see cref="RenderFragment"/> to display as a dialog.
    /// </param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show(
        RenderFragment renderFragment,
        DialogOptions options)
        => Show(renderFragment, null, options);

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="T">
    /// The type of the context parameter for the <paramref name="renderFragment"/>.
    /// </typeparam>
    /// <param name="renderFragment">
    /// The <see cref="RenderFragment{T}"/> to display as a dialog.
    /// </param>
    /// <param name="value">The context parameter for the <paramref name="renderFragment"/>.</param>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<T>(
        RenderFragment<T> renderFragment,
        T value,
        string? title = null,
        DialogOptions? options = null)
    {
        var reference = new DialogReference(this);
        var instance = new RenderFragment(builder =>
        {
            builder.OpenComponent<DialogInstance>(0);
            builder.SetKey(reference.Id);
            builder.AddAttribute(1, nameof(DialogInstance.Id), reference.Id);
            builder.AddAttribute(2, nameof(DialogInstance.Options), options ?? new());
            builder.AddAttribute(3, nameof(DialogInstance.Title), title);
            builder.AddAttribute(4, nameof(DialogInstance.ChildContent), renderFragment(value));
            builder.CloseComponent();
        });
        reference.InjectRenderFragment(instance);

        OnDialogAdded?.Invoke(reference);

        return reference;
    }

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="T">
    /// The type of the context parameter for the <paramref name="renderFragment"/>.
    /// </typeparam>
    /// <param name="renderFragment">
    /// The <see cref="RenderFragment{T}"/> to display as a dialog.
    /// </param>
    /// <param name="value">The context parameter for the <paramref name="renderFragment"/>.</param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<T>(
        RenderFragment<T> renderFragment,
        T value,
        DialogOptions options)
        => Show(renderFragment, value, null, options);

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="TComponent">
    /// The type of component to display as a dialog.
    /// </typeparam>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="parameters">
    /// The parameters to pass to the dialog component.
    /// </param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TComponent>(
        string? title = null,
        DialogParameters? parameters = null,
        DialogOptions? options = null) where TComponent : ComponentBase
    {
        var reference = new DialogReference(this);
        var content = new RenderFragment(builder =>
        {
            builder.OpenComponent(5, typeof(TComponent));
            if (parameters is not null && !reference.AreParametersRendered)
            {
                foreach (var parameter in parameters)
                {
                    builder.AddAttribute(6, parameter.Key, parameter.Value);
                }
                reference.AreParametersRendered = true;
            }
            builder.AddComponentReferenceCapture(7, component => reference.InjectDialog(component));
            builder.CloseComponent();
        });
        var instance = new RenderFragment(builder =>
        {
            builder.OpenComponent<DialogInstance>(0);
            builder.SetKey(reference.Id);
            builder.AddAttribute(1, nameof(DialogInstance.Id), reference.Id);
            builder.AddAttribute(2, nameof(DialogInstance.Options), options ?? new());
            builder.AddAttribute(3, nameof(DialogInstance.Title), title);
            builder.AddAttribute(4, nameof(DialogInstance.ChildContent), content);
            builder.CloseComponent();
        });
        reference.InjectRenderFragment(instance);

        OnDialogAdded?.Invoke(reference);

        return reference;
    }

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <param name="type">The type of component to display as a dialog.</param>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="parameters">
    /// The parameters to pass to the dialog component.
    /// </param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show(
        [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] Type type,
        string? title = null,
        DialogParameters? parameters = null,
        DialogOptions? options = null)
    {
        if (!type.IsAssignableTo(typeof(ComponentBase)))
        {
            throw new ArgumentException($"{nameof(type)} must inherit from {typeof(ComponentBase).FullName}", nameof(type));
        }
        var reference = new DialogReference(this);
        var content = new RenderFragment(builder =>
        {
            builder.OpenComponent(5, type);
            if (parameters is not null && !reference.AreParametersRendered)
            {
                foreach (var parameter in parameters)
                {
                    builder.AddAttribute(6, parameter.Key, parameter.Value);
                }
                reference.AreParametersRendered = true;
            }
            builder.AddComponentReferenceCapture(7, component => reference.InjectDialog(component));
            builder.CloseComponent();
        });
        var instance = new RenderFragment(builder =>
        {
            builder.OpenComponent<DialogInstance>(0);
            builder.SetKey(reference.Id);
            builder.AddAttribute(1, nameof(DialogInstance.Id), reference.Id);
            builder.AddAttribute(2, nameof(DialogInstance.Options), options ?? new());
            builder.AddAttribute(3, nameof(DialogInstance.Title), title);
            builder.AddAttribute(4, nameof(DialogInstance.ChildContent), content);
            builder.CloseComponent();
        });
        reference.InjectRenderFragment(instance);

        OnDialogAdded?.Invoke(reference);

        return reference;
    }

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="TComponent">
    /// The type of component to display as a dialog.
    /// </typeparam>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TComponent>(
        string title,
        DialogOptions options) where TComponent : ComponentBase
        => Show<TComponent>(title, null, options);

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="TComponent">
    /// The type of component to display as a dialog.
    /// </typeparam>
    /// <param name="parameters">
    /// The parameters to pass to the dialog component.
    /// </param>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TComponent>(
        DialogParameters parameters,
        DialogOptions? options = null) where TComponent : ComponentBase
        => Show<TComponent>(null, parameters, options);

    /// <summary>
    /// Display a dialog.
    /// </summary>
    /// <typeparam name="TComponent">
    /// The type of component to display as a dialog.
    /// </typeparam>
    /// <param name="options">The options to configure the dialog.</param>
    /// <returns>A reference to the dialog.</returns>
    public DialogReference Show<[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)] TComponent>(
        DialogOptions options) where TComponent : ComponentBase
        => Show<TComponent>(title: null, null, options);

    /// <summary>
    /// Displays a dialog which presents the user with a message and returns a
    /// nullable <see cref="bool"/> indicating their response.
    /// </summary>
    /// <param name="title">The title to show in the header.</param>
    /// <param name="options">
    /// <para>
    /// The options to configure the dialog.
    /// </para>
    /// <para>
    /// If omitted, the dialog will have a single button with the text "OK" that
    /// indicates a <see langword="true"/> response.
    /// </para>
    /// </param>
    public async Task<bool?> ShowMessageBox(
        string? title = null,
        MessageBoxOptions? options = null)
    {
        options ??= new();
        var parameters = new DialogParameters()
        {
            [nameof(MessageBox.AltText)] = options.AltText,
            [nameof(MessageBox.CancelText)] = options.CancelText,
            [nameof(MessageBox.Message)] = options.Message,
            [nameof(MessageBox.OkText)] = options.OkText,
            [nameof(MessageBox.Title)] = title,
        };
        var reference = Show<MessageBox>(title, parameters, options);
        var result = await reference.Result;
        return result.Choice switch
        {
            DialogChoice.Ok => true,
            DialogChoice.Alt => false,
            _ => null,
        };
    }

    /// <summary>
    /// Displays a dialog which presents the user with a message and returns a
    /// nullable <see cref="bool"/> indicating their response.
    /// </summary>
    /// <param name="options">
    /// <para>
    /// The options to configure the dialog.
    /// </para>
    /// <para>
    /// If omitted, the dialog will have a single button with the text "OK" that
    /// indicates a <see langword="true"/> response.
    /// </para>
    /// </param>
    public Task<bool?> ShowMessageBox(MessageBoxOptions options)
        => ShowMessageBox(null, options);
}
