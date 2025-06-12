graph TD

%% === CORE CONTAINER ===
UniversalViewer["UniversalViewer<br/>Main orchestrator"]:::core

%% === CONTENT HANDLING LAYER ===
subgraph "Content Handling Layer"
  ContentHandler["ContentHandler<br/>Handles content types"]:::core
  IIIFContentHandler["IIIFContentHandler<br/>Handles IIIF manifests"]:::core
  YouTubeContentHandler["YouTubeContentHandler<br/>Handles YouTube videos"]:::core
end

UniversalViewer -->|"manages"| ContentHandler
ContentHandler -->|"loads"| IIIFContentHandler
ContentHandler -->|"loads"| YouTubeContentHandler

%% === UI PANELS AND MODULES ===
subgraph "UI Panels"
  HeaderPanel["Header Panel<br/>Top navigation"]:::core
  FooterPanel["Footer Panel<br/>Bottom navigation"]:::core
  LeftPanel["Left Panel<br/>Side navigation"]:::core
  RightPanel["Right Panel<br/>Side controls"]:::core
  CenterPanel["Center Panel<br/>Main content area"]:::core
end

UniversalViewer -->|"coordinates"| HeaderPanel
UniversalViewer -->|"coordinates"| FooterPanel
UniversalViewer -->|"coordinates"| LeftPanel
UniversalViewer -->|"coordinates"| RightPanel
UniversalViewer -->|"coordinates"| CenterPanel

%% === EVENT SYSTEM ===
subgraph "Event System"
  Events["Events<br/>Global event constants"]:::core
  PubSub["PubSub<br/>Event bus for communication"]:::core
end

UniversalViewer -->|"uses"| Events
UniversalViewer -->|"uses"| PubSub

%% === EXTERNAL RESOURCES ===
subgraph "External Resources"
  UVAdapter["UVAdapter<br/>External config/state management"]:::core
  Localization["Localization<br/>Locale JSON files"]:::core
end

UniversalViewer -->|"uses"| UVAdapter
UniversalViewer -->|"uses"| Localization

%% === DATA FLOW ===
UniversalViewer -->|"initializes"| ContentHandler
ContentHandler -->|"detects content type"| IIIFContentHandler
ContentHandler -->|"detects content type"| YouTubeContentHandler
IIIFContentHandler -->|"emits events"| Events
YouTubeContentHandler -->|"emits events"| Events

%% === STYLES ===
classDef core fill:#1E90FF,stroke:#000,color:#000,stroke-width:2px,rx:10px,ry:10px;