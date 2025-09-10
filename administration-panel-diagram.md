erDiagram
    users ||--o{ user_roles : "has"
    users ||--o{ user_permissions : "has"
    roles ||--o{ role_permissions : "contains"
    roles ||--o{ user_roles : "assigned to"
    permissions ||--o{ role_permissions : "included in"
    permissions ||--o{ user_permissions : "assigned to"
    
    users {
        int id PK
        string username
        string password_hash
        string email
        bool is_active
        bool is_2fa_enabled
        string totp_secret
        datetime created_at
        datetime updated_at
    }
    
    roles {
        int id PK
        string name
        string description
    }
    
    permissions {
        int id PK
        string task_name
        string action
        string description
    }
    
    user_roles {
        int id PK
        int user_id FK
        int role_id FK
    }
    
    role_permissions {
        int id PK
        int role_id FK
        int permission_id FK
    }
    
    user_permissions {
        int id PK
        int user_id FK
        int permission_id FK
    }