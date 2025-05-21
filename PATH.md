<!-- omit from toc -->
# Universal Viewer Execution Path

- [Background](#background)
- [Entrypoint](#entrypoint)
- [Init](#init)
  - [Resizing](#resizing)
  - [Fullscreen](#fullscreen)
- [UniversalViewer](#universalviewer)
- [Content Handler](#content-handler)
  - [YouTubeContentHandler](#youtubecontenthandler)
- [Extension](#extension)

## Background

The purpose of this document it to provide an overview of the key structural points of the Universal Viewer and how / when certain code is executed in the process of initialising, configuring, and displaying the Viewer and the requested content.

Certain functions may be only mentioned in passing, or omitted entirely, if they are not key to understanding how the UV works or if their code is simple enough to understand without higher-level knowledge of Java/TypeScript or the UV.

This document makes the assumption that implementation of the viewer matches the example HTML file i.e. UV loaded via `<script>` and `UV.init(<elementId>, { configJSON })` is called.

```
<script>
  document.addEventListener("DOMContentLoaded", function() {
  var urlAdapter = new UV.IIIFURLAdapter(true);

  const data = urlAdapter.getInitialData({
    embedded: true,
  });

  uv = UV.init("uv", data);
</script>
```

## Entrypoint

The entrypoint file `index.ts` loads `shim-jquery` to import jQuery, and puts the `jQuery` and `$` objects in the global namespace `window`.

It then exports the following classes/enums:

1. ContentType
2. Events
3. IIIFEvents
4. YouTubeEvents

and also exports the `URLAdapater` (as `IIIFURLAdapter`) and `UniversalViewer` (as `Viewer`) classes.

Finally it exports the `init` function.

As can be seen in the example `uv.html` file, these enums/classes are all available in the `UV` namespace.

## Init

Init is a function in `init.ts` that initialises and embeds the viewer into a target container DOM element, handles resizing, fullscreen toggling, and error handling.

It returns an instance of [UniversalViewer](#universalviewer)

`init = (el: string | HTMLDivElement, data)`

If `el` is a string it will be assumed to be the `id` attribute of the element the viewer will be contained in.

This element is then emptied and pair of parent/child `div`s are added with the inner one being the `uvDiv` that the viewer loads in:

`el > div (parent) > div (uvDiv)`

This structure is required for fullscreen functionality to work in Safari browsers.

A new UniversalViewer instance is then created with `uvDiv` and `data` as args passed as a JSON object matching the `IUVOptions` type.

### Resizing

A resize function is defined that changes the width and height of div (parent) to match either the container (`el`) div or `window` if the viewer is fullscreen.

This function is assigned as the handler for the standard `resize` and `orientationchange` events on `window` and is also called when handling the following from the `Events` enum:

- **CREATED**: Triggers a resize once the viewer is initialized.
- **EXTERNAL_RESOURCE_OPENED**: Resizes 100ms after resources are opened.
- **TOGGLE_FULLSCREEN**: A delayed resize is called after handling fullscreen events.

### Fullscreen

Handler functions are defined and bound to standard fullscreen events depending on the specific browser being used.

## UniversalViewer

*extends BaseContentHandler*

The UniversalViewer class is primarily responsible for determining the content type to be viewed and creating the relevant Content Handler class.

Currently the following content handlers exist:

- IIIFContentHandler
- YouTubeContentHandler

It dynamically imports the relevant handler (using Webpack's lazy-loading) from the `ContentHandler: IContentHandlerRegistry` constant and instantiates its `default` export, passing the `IUVOptions`, a `UVAdapter` instance (usually null, may be a `URLAdapater` instance), and any externally registered event handlers.

These external handlers are set via the `on()` function, e.g.

```
const configUrl = urlAdapter.get('config');
if (configUrl) {
  uv.on("configure", function({ config, cb }) {
    cb(
      new Promise(function (resolve) {
        fetch(configUrl).then(function (response) {
          resolve(response.json());
        });
      });
    );
  })
}
```

It also provides access to the following public functions. Calls to these functions are passed along to the equivalent function in the assigned Content Handler.

- exitFullScreen
- resize
- dispose
- set: one of two paths
  1. Content type has changed - creates a new handler
  2. Content type is the same - calls `set()` on the Content Handler

## Content Handler

Like the UniversalViewer class, Content Handlers *extend BaseContentHandler* 

This section will mainly focus on the `IIIFContentHandler` class.

THe key part of this class is `_init()`, which in turn calls `set()`, which the (on the first load) calls `_reload()`.

The _reload function uses Manifold and Manifesto to parse the manifest, and based on the media type, rendering format, or external resource type found in the IIIF manifest, it selects an appropriate UV extension (e.g., OpenSeadragon, PDF, etc.).

The relevant Extension class is then dynamically imported.

When an extension is instantiated its config comes initially from `defaultConfig` at `./config/config.json`.

This config file contains markers prefixed with `$` which are used for replacing locale strings 

 and `_loadAndApplyConfigToExtension()` is called.

When

 This loads the relevant config file for the current locale 

Finally, in _createExtension, the IIIFContentHandler is assigned as the extension's extensionHost, the data variable from init is set in the extension, as is the Manifesto Helper object.


### YouTubeContentHandler

## Extension

