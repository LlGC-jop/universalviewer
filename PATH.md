<!-- omit from toc -->
# Universal Viewer Execution Path

- [Setup](#setup)
- [index.ts](#indexts)
- [Init.ts](#initts)
  - [Resizing](#resizing)
  - [Events](#events)
  - [Fullscreen](#fullscreen)
  - [Return](#return)
- [UniversalViewer](#universalviewer)
  - [Constructor](#constructor)
  - [Assigning a Content Handler](#assigning-a-content-handler)
- [Content Handler](#content-handler)

## Setup

## index.ts

1. Shim jQuery and $ into global window space 
2. Export ContentType, Events, IIIFEvents, YouTubeEvents classes/enum 
3. Export URLAdapter class as IIIFURLAdapter 
4. Export UniversalViewer class as Viewer 
5. Export init function

## Init.ts

Init is a function that initialises and embeds the viewer into a target container DOM element, handles resizing, fullscreen toggling, and error handling.

Args: **el, data**

1. Accepts a target contaienr element (el) and data to pass into the viewer.
2. Resolves the DOM element if el is an ID string.
3. Empties the target and creates a new nested structure: `container > parent > uvDiv`
4. Instantiates UniversalViewer, attaching it to uvDiv and passing in the data.

### Resizing

- Defines a resize function that adjusts the parent div dimensions:
- If in fullscreen mode (and not overridden), it fills the window.
- Otherwise, it matches the container’s dimensions.
- Sets up window listeners for resize and orientationchange.

### Events

- **CREATED**: Triggers a resize once the viewer is initialized.
- **EXTERNAL_RESOURCE_OPENED**: Delays a resize after resources are opened.
- **TOGGLE_FULLSCREEN**: Updates fullscreen state. 
  - Uses browser-specific fullscreen APIs to enter/exit fullscreen mode. 
  - Triggers a delayed resize.
- **ERROR**: Logs any viewer errors to the console.

### Fullscreen

- Detects when the user exits fullscreen via browser controls and informs the viewer to exit fullscreen mode.
- `getRequestFullScreen(elem)` and `getExitFullScreen()` return the correct browser-specific fullscreen API methods.

### Return

Returns an instance of the UniversalViewer class.

## UniversalViewer

**UniversalViewer extends BaseContentHandler**

Does the following:

1. Determines content type - currently IIIF or YouTube
2. Dynamically load the matching content handler module using Webpack's lazy loading.
3. Initialize, configure, and delegate to the selected content handler.
4. Provide lifecycle methods like set, resize, exitFullScreen, and dispose.
5. Forward external event listeners to the underlying content handler.

### Constructor

Args: **public options: `IUVOptions`**

```
export interface IUVOptions {
  target: HTMLElement;
  data: IUVData<any>;
}
```

```
interface IUVData<T extends BaseConfig>
  extends IIIFData,
    EPubData,
    YouTubeData {
  config?: T; // do not pass this on initialisation, internal use only
  debug?: boolean;
  embedded?: boolean;
  isReload?: boolean;
  locales?: ILocale[];
  target?: string;
}
```

- target: The DOM element to attach the viewer to.
- data: The data used to determine which content handler to use.

Immediately calls `_assignContentHandler()` to choose and load the right content handler.

### Assigning a Content Handler

`private async _assignContentHandler(data: IUVData<any>)`

1. Determines content type from the input data:
  - Supports legacy format (`manifest` → `iiifManifestId`).
  - Defaults to `UNKNOWN` if no type is found.
2. If the content type has changed:
   - Disposes of any existing content handler.
   - Lazy-loads the new content handler module.
   - Instantiates the new handler with:
     - target DOM element
     - data
     - Shared adapter and external event listeners
- Stores the new handler in both `assignedContentHandler` and `_assignedContentHandler` (for backward compatibility?).

## Content Handler

