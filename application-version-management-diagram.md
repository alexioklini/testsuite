# Application/Version Management Component Structure

```mermaid
graph TD
    A[AppBar] --> B[SettingsDialog Trigger]
    A --> C[Suite Execution Dialog Trigger]
    
    B --> D[SettingsDialog]
    D --> E[Applications Tab]
    D --> F[Versions Tab]
    
    E --> G[Applications List]
    E --> H[Add Application Form]
    E --> I[Edit Application Form]
    
    F --> J[Versions List]
    F --> K[Add Version Form]
    F --> L[Edit Version Form]
    
    C --> M[Suite Execution Dialog]
    M --> N[Application Dropdown]
    M --> O[Version Dropdown]
    M --> P[Execution Form Fields]
    
    N --> Q[Applications API]
    O --> R[Versions API]
    
    Q --> S[Applications Table]
    R --> T[Versions Table]
    
    S --> U[Database]
    T --> U
    
    M --> V[Suite Executions API]
    V --> W[Suite Executions Table]
    W --> U
    
    D --> Q
    D --> R
```

# Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant SettingsDialog
    participant API
    participant Database
    
    User->>Dashboard: Click Settings
    Dashboard->>SettingsDialog: Open Dialog
    SettingsDialog->>API: GET /applications
    API->>Database: Query applications
    Database-->>API: Return applications
    API-->>SettingsDialog: Applications data
    SettingsDialog->>SettingsDialog: Display applications
    
    User->>SettingsDialog: Add new application
    SettingsDialog->>API: POST /applications
    API->>Database: Insert application
    Database-->>API: Success
    API-->>SettingsDialog: New application data
    SettingsDialog->>SettingsDialog: Update local state
    
    User->>Dashboard: Start Suite Execution
    Dashboard->>Dashboard: Check if apps/versions exist
    Dashboard->>API: GET /applications
    API->>Database: Query applications
    Database-->>API: Return applications
    API-->>Dashboard: Applications data
    Dashboard->>API: GET /versions
    API->>Database: Query versions
    Database-->>API: Return versions
    API-->>Dashboard: Versions data
    Dashboard->>Dashboard: Open Suite Execution Dialog
    Dashboard->>Dashboard: Populate dropdowns
    
    User->>Dashboard: Submit execution
    Dashboard->>API: POST /test-suites/{id}/start-execution
    API->>Database: Insert suite execution
    Database-->>API: Success
    API-->>Dashboard: Execution started