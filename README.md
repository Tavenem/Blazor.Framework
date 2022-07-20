![build](https://img.shields.io/github/workflow/status/Tavenem/Blazor.Framework/publish/main) [![NuGet downloads](https://img.shields.io/nuget/dt/Tavenem.Blazor.Framework)](https://www.nuget.org/packages/Tavenem.Blazor.Framework/)

Tavenem.Blazor.Framework
==

Tavenem.Blazor.Framework is a [Razor class
library](https://docs.microsoft.com/en-us/aspnet/core/razor-pages/ui-class) (RCL) containing a
stylesheet and [Razor components](https://docs.microsoft.com/en-us/aspnet/core/blazor/components/class-libraries).
It provides a framework for quickly creating [Blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor) projects.

## Documentation

You can browse extensive documentation and samples at [https://tavenem.com/Blazor.Framework](https://tavenem.com/Blazor.Framework).

## Installation

Tavenem.Blazor.Framework is available as a [NuGet package](https://www.nuget.org/packages/Tavenem.Blazor.Framework/).

## Use

1. Call the `AddTavenemFramework()` extension method on your `IServiceCollection`.

1. Add a link to the stylesheet in your index.html or _Host.cshtml file:

    ```html
    <link href="_content/Tavenem.Blazor.Framework/styles.css" rel="stylesheet" />
    ```

1. See the documentation for additional guidelines on using the framework in your project.

## Roadmap

This project is currently in preview. The first production release is currently planned to coincide with the production release of .NET 7. Breaking changes are possible (even likely) prior to the v1.0 release.

Additional components may be added based on user feedback.

## Contributing

Contributions are always welcome. Please carefully read the [contributing](docs/CONTRIBUTING.md) document to learn more before submitting issues or pull requests.

## Code of conduct

Please read the [code of conduct](docs/CODE_OF_CONDUCT.md) before engaging with our community, including but not limited to submitting or replying to an issue or pull request.