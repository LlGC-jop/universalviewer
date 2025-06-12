# Deep Architectural Overview of the Universal Viewer Project

## High-Level Summary

The Universal Viewer (UV) is a modular, extensible, open-source library designed to facilitate the presentation of diverse multimedia content types (images, videos, PDFs, IIIF manifests, etc.) within web applications. Its architecture emphasizes flexibility, community-driven extensibility, and support for multiple content handlers, themes, localization, and external integrations. The core system is built around a containerized, plugin-based architecture, with a central `UniversalViewer` class orchestrating content handling, user interface panels, and external resource interactions.

---

## 1. Major Architectural Containers and Subsystems

### 1.1 Core Container: `UniversalViewer`
- **Role:** The main orchestrator and facade for the entire system.
- **Responsibilities:**
  - Manages content handlers based on content type.
  - Coordinates UI panels (header, footer, side panels).
  - Handles global events, resizing, full-screen toggling.
  - Provides an API for setting content, resizing, disposing.
- **Implementation Details:**
  - Extends `BaseContentHandler`, inheriting event management and lifecycle.
  - Maintains references to the assigned content handler (`assignedContentHandler`).
  - Uses a registry (`ContentHandler`) to dynamically import content handler modules based on content type.
  - Supports event subscription and publishing (`Events`, `PubSub`).

### 1.2 Content Handling Layer
- **Main Class:** `ContentHandler` (via `UniversalViewer`)
- **Content Handlers:**
  - **IIIF:** `IIIFContentHandler` (most complex, supports manifests, canvases, annotations, extensions)
  - **YouTube:** `YouTubeContentHandler`
  - **Others:** PDF, EPUB, OpenSeadragon, MediaElement, Aleph, ModelViewer, etc.
- **Design Pattern:** Lazy-loaded modules via dynamic `import()` statements, enabling modular extension.
- **Responsibilities:**
  - Load and display specific content types.
  - Manage content-specific UI and controls.
  - Handle content lifecycle: set, resize, dispose.
  - Communicate with the core container via events (`Events`, `IIIFEvents`, `YouTubeEvents`).

### 1.3 UI Panels and Modules
- **Panels:**
  - Header, Footer, Left, Right, Center panels.
  - Configurable via JSON (`uv-iiif-config.json`) and code.
  - Modular, extendable via `Extension` modules.
- **Modules:**
  - UI components such as resource lists, annotation panels, navigation, search, sharing, embedding.
  - Implemented as `ModuleConfig` objects, with options and content.
  - Loaded dynamically, supporting themes and localization.

### 1.4 External Resources and Integrations
- **Localization:** Multiple locale JSON files (`en-GB.json`, `fr-FR.json`, etc.).
- **Content Extensions:** Support for IIIF extensions (pdf, epub, openSeadragon, mediaelement, aleph, model-viewer).
- **Content Adapters:** `UVAdapter` class for external configuration and state persistence.
- **External APIs:** YouTube iframe API, IIIF manifests, OpenSeadragon, MediaElement, etc.

---

## 2. Source Code Structure and Modules

### 2.1 Entry Point: `src/index.ts`
- Initializes the system, exports core classes (`UniversalViewer`, `Events`, `ContentType`, `init`).
- Sets up the global environment and entry API.

### 2.2 Main Class: `UniversalViewer`
- **Inheritance:** Extends `BaseContentHandler`.
- **Key Methods:**
  - `set(data)`: Sets content, manages content handler switching.
  - `resize()`: Propagates resize to current content handler.
  - `dispose()`: Cleans up resources.
  - `on()`: Event subscription.
- **Content Handler Management:**
  - Uses `ContentType` enum to determine content type.
  - Dynamically imports content handler modules (`IIIFContentHandler`, `YouTubeContentHandler`).
  - Handles content type changes with disposal and reinitialization.
- **Event System:** Uses `PubSub` for internal event communication.
- **Configuration:** Supports dynamic configuration, themes, localization.

### 2.3 Content Handlers
- **IIIF:** `IIIFContentHandler` (complex, supports extensions, annotations, manifests)
- **YouTube:** `YouTubeContentHandler` (integrates with iframe API, manages playback, events)
- **Others:** Placeholder for PDF, EPUB, OpenSeadragon, media, Aleph, ModelViewer, etc.

### 2.4 Event System
- **Classes:** `Events`, `IIIFEvents`, `YouTubeEvents`.
- **Mechanism:** Publish/subscribe pattern (`PubSub` class).
- **Usage:** Content handlers fire events (`created`, `load`, `error`), UI panels listen and react.

### 2.5 External Configuration & Localization
- JSON files (`uv-iiif-config.json`, locale JSONs).
- `UVAdapter` class for external state/config management.
- Localization via locale JSONs, supporting multiple languages.

---

## 3. Key Components and Their Responsibilities

| Component               | Role                                            | Dependencies                                  | Notes                                     |
| ----------------------- | ----------------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| `UniversalViewer`       | Main orchestrator                               | `BaseContentHandler`, dynamic import registry | Manages content, panels, events           |
| `BaseContentHandler`    | Lifecycle & event base                          | `IContentHandler` interface                   | Provides event/pubsub, dispose, configure |
| `IIIFContentHandler`    | Handles IIIF manifests, annotations, extensions | `manifesto.js`, `UVAdapter`, `IIIFEvents`     | Supports extensions, dynamic modules      |
| `YouTubeContentHandler` | Embeds and controls YouTube videos              | iframe API, `YouTubeEvents`                   | Manages iframe, events, playback controls |
| `Events`                | Global event constants                          | -                                             | Used for internal communication           |
| `PubSub`                | Event bus                                       | -                                             | Decouples components                      |
| `UVAdapter`             | External config/state                           | -                                             | Can be extended for persistence           |
| UI Panels               | Navigation, info, controls                      | Modules, configuration JSON                   | Modular, themeable                        |

---

## 4. Data and Control Flow

### 4.1 Initialization
- `init()` creates a container, instantiates `UniversalViewer`.
- Loads initial data (`IUVData`) from URL, configuration, or external sources.
- Content type detection triggers dynamic import of the appropriate handler.

### 4.2 Content Setting
- `set(data)`:
  - Detects content type.
  - Disposes previous handler if content type changes.
  - Loads new handler module asynchronously.
  - Calls `set()` on the handler with data.
  - Shows spinner during load.

### 4.3 Content Interaction
- Content handlers emit events (`created`, `load`, `error`).
- `UniversalViewer` listens and propagates events.
- UI panels respond to events (e.g., full-screen toggle, navigation).

### 4.4 Resizing & Fullscreen
- `resize()` propagates to current content handler.
- Full-screen toggling via `Init.ts` event listeners.
- Dynamic resize adjusts container dimensions and triggers content resize.

### 4.5 External Communication
- URL parameters (`iiif-content`, `locales`, etc.) influence initial data.
- Event system allows external scripts to control viewer (e.g., change manifest, navigate).

---

## 5. Extensibility & Community Contributions

- **Dynamic Module Loading:** Content handlers and extensions are loaded via `import()` with webpack hints (`webpackMode: "lazy"`).
- **Extension Host:** `IIIFExtensionHost` interface supports adding custom extensions (e.g., PDF, EPUB, 3D models).
- **Themes & Localization:** Themes stored in `themes/`, localization files in `locales/`.
- **Plugin Architecture:** Modules are configured via JSON, allowing community extensions to add panels, controls, or content handlers.

---

## 6. Missing or Uncertain Details

- **Runtime Data Flow:** Precise control flow during complex interactions (e.g., annotations, search) is inferred but not exhaustively detailed.
- **UI Panel Composition:** Specific panel components and their internal architecture are modular but not fully detailed.
- **State Management:** External state persistence (via `UVAdapter`) is supported but implementation specifics depend on extension.
- **Content Extensions:** The exact extension points for IIIF extensions (pdf, epub, 3D) are modular but their internal architecture is complex and dynamically loaded.

---

# Summary

The Universal Viewer is a **modular, plugin-based, containerized web application** built around a core `UniversalViewer` class that dynamically loads content handlers based on detected content types. It employs a **lazy-loading, extension-friendly architecture** with a **robust event system** (`Events`, `PubSub`) for decoupled communication. Content handlers like `IIIFContentHandler` and `YouTubeContentHandler` encapsulate content-specific logic, supporting extensions, localization, and themes. The system is designed for **extensibility**, **community contributions**, and **configurability** via JSON modules and dynamic imports, making it adaptable to a wide range of multimedia presentation needs.

---

This detailed architecture description provides a comprehensive foundation for generating a precise system diagram in Mermaid or similar notation, capturing containers, modules, dependencies, and data/control flows.