# Konzept zur Implementierung von Unittests

## 1. Analyse der vorhandenen Codebasis

Die Anwendung besteht aus drei Hauptkomponenten:
- **Client**: React/TypeScript-Frontend mit Material-UI
- **Server**: Node.js/Express-Backend mit SQLite-Datenbank
- **Shared**: Gemeinsam genutzte Typdefinitionen

### Testbare Komponenten im Server:
- Authentifizierungsfunktionen (Login, Registrierung, 2FA)
- CRUD-Operationen für Test-Suites und Tests
- Testausführungsfunktionen
- Anwendungs- und Versionsverwaltung
- Datei-Upload-Funktionen
- Rollen- und Berechtigungsmanagement

### API-Endpunkte für die Administration:
- Benutzerverwaltung (Liste, Details, Deaktivierung, Passwort-Reset, 2FA-Reset)
- Rollenverwaltung (Liste, Erstellung, Aktualisierung, Löschung, Berechtigungen zuweisen)
- Berechtigungsverwaltung (Liste, Details)
- Benutzerzuweisungen (Rollen und direkte Berechtigungen zuweisen/entfernen)

### Testbare Komponenten im Client:
- Dashboard-Komponente
- Formularverarbeitung (Test-Suites, Tests)
- API-Interaktionen über api.ts
- Routing und Authentifizierung
- Dialogkomponenten (Modale)
- Zustandsmanagement (useState, useEffect)

## 2. Auswahl geeigneter Test-Frameworks

### Server (Node.js/Express):
- **Jest**: Haupttest-Framework für Unit- und Integrationstests
  - Einfache Konfiguration und umfangreiche Dokumentation
  - Gute TypeScript-Unterstützung
  - Integrierte Mocking-Funktionen
- **Supertest**: Für API-Integrationstests
  - Ermöglicht das Testen von HTTP-Endpunkten ohne laufenden Server

### Client (React):
- **Jest**: Haupttest-Framework (bereits in Create React App integriert)
- **React Testing Library**: Für Komponententests
  - Fokus auf Benutzerinteraktionen
  - Gute Praktiken für zugängliche Anwendungen
- **Cypress**: Für End-to-End-Tests
  - Visuelle Testausführung
  - Debugging-Funktionen

## 3. Definition von Teststrategien

### Unit Tests (40% der Tests):
- **Server**: Testen einzelner Funktionen und Module isoliert
  - Authentifizierungsfunktionen (bcrypt, JWT)
  - Validierungsfunktionen
  - Hilfsfunktionen (z.B. SMS-Simulation)
  - Mocks werden verwendet, um externe Abhängigkeiten zu simulieren
- **Client**: Testen von Komponentenlogik, Hilfsfunktionen, Zustandsänderungen

### Integration Tests (40% der Tests):
- **Server**: Testen der Interaktion zwischen verschiedenen Modulen
  - API-Endpunkte mit Supertest
  - Datenbankoperationen (CRUD)
  - Middleware (Authentifizierung, Fehlerbehandlung)
  - Verwenden einer Testdatenbank
- **Client**: Testen von API-Integrationen, komplexen Komponenteninteraktionen

### End-to-End Tests (20% der Tests):
- **Server**: Testen kompletter Benutzerflows
  - Komplette Benutzerflows (Login bis Testausführung)
  - Komplexe Workflows über mehrere Endpunkte
  - Verwenden eines vollständigen Testservers
- **Client**: Testen kompletter Benutzerflows (Login bis Testausführung)
### 3.1 Testtypen und ihre Anwendung auf API-Endpunkte

#### Unit Tests
Unit Tests konzentrieren sich auf die Prüfung einzelner Funktionen oder Module isoliert vom Rest der Anwendung. Für die API-Endpunkte bedeutet dies:

- **Authentifizierung und Autorisierung**: Testen der bcrypt- und JWT-Funktionen unabhängig von der API.
- **Validierungsfunktionen**: Testen von Eingabedatenvalidierungen für API-Anfragen.
- **Hilfsfunktionen**: Testen von Funktionen wie SMS-Simulation oder anderen Hilfsdiensten.

Diese Tests verwenden Mocks, um externe Abhängigkeiten wie Datenbanken oder externe Dienste zu simulieren.

#### Integration Tests
Integration Tests prüfen die Interaktion zwischen verschiedenen Modulen der Anwendung. Für die API-Endpunkte bedeutet dies:

- **API-Endpunkte**: Testen der HTTP-Endpunkte mit Supertest, um sicherzustellen, dass die Endpunkte korrekt mit der Datenbank und anderen Diensten interagieren.
- **Datenbankoperationen**: Testen von CRUD-Operationen direkt gegen eine Testdatenbank.
- **Middleware**: Testen von Authentifizierungs- und Fehlerbehandlungsmiddleware.

Diese Tests verwenden eine separate Testdatenbank und führen echte Datenbankoperationen durch.

#### Sicherheitstests
Sicherheitstests konzentrieren sich auf die Identifizierung von Sicherheitsanfälligkeiten in der Anwendung. Für die API-Endpunkte bedeutet dies:

- **Authentifizierungstests**: Überprüfung, ob Authentifizierungsmechanismen korrekt implementiert sind und nicht umgangen werden können.
- **Autorisierungstests**: Überprüfung, ob Benutzer nur auf die Ressourcen zugreifen können, für die sie berechtigt sind.
- **Eingabedatenvalidierung**: Überprüfung, ob die API gegen gängige Angriffe wie SQL-Injection oder XSS geschützt ist.
- **Rate Limiting**: Überprüfung, ob Mechanismen zum Schutz vor Brute-Force-Angriffen implementiert sind.

Diese Tests sollten automatisiert und regelmäßig ausgeführt werden.

#### Performance Tests
Performance Tests messen die Reaktionsfähigkeit, Stabilität und Skalierbarkeit der API-Endpunkte unter verschiedenen Lastbedingungen. Für die API-Endpunkte bedeutet dies:

- **Lasttests**: Simulieren mehrerer gleichzeitiger Benutzer, um die Reaktionszeit der API zu messen.
- **Stresstests**: Testen der API unter extremen Bedingungen, um den Punkt der Überlastung zu finden.
- **Durchsatztests**: Messen der Anzahl der Anfragen, die die API pro Sekunde verarbeiten kann.

Diese Tests helfen dabei, Engpässe in der Anwendung zu identifizieren und sicherzustellen, dass die API unter realistischen Bedingungen gut funktioniert.

## 4. Vorschläge für Testabdeckung und Qualitätsmetriken

### Anfängliche Ziele:
- **Testabdeckung**: 60% für kritische Pfade (Authentifizierung, CRUD-Operationen)
- **Codequalität**: ESLint/Prettier für Konsistenz
- **Maximale Komplexität**: Cyclomatic Complexity < 10 pro Funktion

### Qualitätsmetriken:
- **Testlaufzeit**: < 30 Sekunden für Unit-Tests
- **Fehlerdichte**: < 1 kritischer Fehler pro 1000 LOC
- **Teststabilität**: > 95% Bestanden-Rate in wiederholten Ausführungen

### Priorisierung:
1. Authentifizierung und Autorisierung
2. CRUD-Operationen für Test-Suites und Tests
3. Testausführungsfunktionen
4. Datei-Upload und -Verwaltung
5. Benutzeroberfläche (Dashboard, Formulare)

## 5. Empfehlungen für CI/CD Integration

Da derzeit keine CI/CD-Integration geplant ist, werden grundlegende Vorschläge für eine spätere Implementierung gemacht:

### GitHub Actions (wenn später verwendet):
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test
```

### Qualitätskontrolle:
- Automatische Testausführung bei jedem Push
- Code Coverage-Berichte
- Automatische Bereinigung bei fehlgeschlagenen Tests

## 6. Implementierungsvorschläge

### Server-Tests:
1. **Unit Tests**:
   - Authentifizierungsfunktionen (bcrypt, JWT)
   - Validierungsfunktionen
   - Hilfsfunktionen (z.B. SMS-Simulation)
   - Mocks für externe Abhängigkeiten:
     - Datenbank-Mocks (jest.mock für better-sqlite3)
     - Dateisystem-Mocks (mock-fs)
     - Externe Service-Mocks (SMS-Service, Zeitfunktionen, crypto-Funktionen)

2. **Integration Tests**:
   - API-Endpunkte mit Supertest
   - Datenbankoperationen (CRUD)
   - Middleware (Authentifizierung, Fehlerbehandlung)
   - Verwendung einer separaten SQLite-Testdatenbank
   - Automatische Erstellung und Löschung der Testdatenbank vor/nach Tests
   - Datenbankfixtures für verschiedene Testfälle (Benutzer, TestSuites, Tests, Anwendungen, Versionen)

3. **End-to-End Tests**:
   - Komplette Benutzerflows (Login bis Testausführung)
   - Komplexe Workflows über mehrere Endpunkte
   - Verwendung eines vollständigen Testservers

### Client-Tests:
1. **Unit Tests**:
   - Komponentenlogik (Dashboard, Formulare)
   - API-Hilfsfunktionen
   - Zustandsmanagement

2. **Integration Tests**:
   - API-Interaktionen
   - Komplexe Komponenten (Tabellen, Dialoge)

3. **E2E Tests**:
   - Komplette Benutzerflows (Login, Test-Suite-Erstellung, Ausführung)
   - Fehlerbehandlung und Validierung

### Nächste Schritte:
1. Installation der Test-Frameworks in beiden Projekten
2. Erstellung einer grundlegenden Teststruktur
3. Implementierung von Beispieltests für kritische Funktionen
4. Einrichtung von npm-Skripten für Testausführung
5. schrittweise Erweiterung der Testabdeckung

## 7. API-Testabdeckung

### 7.1 Authentifizierung und Autorisierung

#### 7.1.1. POST /api/auth/register - Benutzerregistrierung

**Beschreibung:** Testet die Registrierung eines neuen Benutzers im System.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Kein Benutzer mit dem gleichen Benutzernamen existiert.
- **Anfrage:**
  ```json
  {
    "username": "testuser",
    "password": "securepassword123",
    "real_name": "Test User",
    "email": "test@example.com"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "User registered"
    }
    ```
  - Der neue Benutzer ist in der Datenbank gespeichert.

**Edge-Cases:**
- **Doppelter Benutzername:**
  - **Vorbedingung:** Ein Benutzer mit dem Benutzernamen "testuser" existiert bereits.
  - **Anfrage:**
    ```json
    {
      "username": "testuser",
      "password": "anotherpassword123",
      "real_name": "Another Test User",
      "email": "another@example.com"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Username already exists"
      }
      ```

- **Fehlende Pflichtfelder:**
  - **Anfrage:**
    ```json
    {
      "username": "",
      "password": "securepassword123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400 (abhängig von der Serverimplementierung, da keine explizite Validierung im Code zu sehen ist)

#### 7.1.2. POST /api/auth/login - Benutzeranmeldung

**Beschreibung:** Testet die Anmeldung eines bestehenden Benutzers mit gültigen Anmeldedaten.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein Benutzer mit dem Benutzernamen "testuser" und Passwort "securepassword123" existiert.
- **Anfrage:**
  ```json
  {
    "username": "testuser",
    "password": "securepassword123"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - Der Token ist gültig für authentifizierte Anfragen.

**Edge-Cases:**
- **Ungültige Anmeldedaten:**
  - **Anfrage:**
    ```json
    {
      "username": "testuser",
      "password": "wrongpassword"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 401
    - Antwort:
      ```json
      {
        "error": "Invalid credentials"
      }
      ```

- **Nicht existierender Benutzer:**
  - **Anfrage:**
    ```json
    {
      "username": "nonexistentuser",
      "password": "anypassword"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 401
    - Antwort:
      ```json
      {
        "error": "Invalid credentials"
      }
      ```

#### 7.1.3. POST /api/auth/login-2fa - Benutzeranmeldung mit 2FA

**Beschreibung:** Testet die Anmeldung eines Benutzers mit aktivierter Zwei-Faktor-Authentifizierung.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein Benutzer mit dem Benutzernamen "testuser", Passwort "securepassword123" und aktivierter 2FA existiert.
- **Anfrage:**
  ```json
  {
    "username": "testuser",
    "password": "securepassword123"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "requires2FA": true,
      "userId": 1,
      "message": "2FA required. Code sent to your phone."
    }
    ```
  - Ein 2FA-Code wurde generiert und gespeichert.

**Edge-Cases:**
- **Benutzer ohne 2FA:**
  - **Vorbedingung:** Ein Benutzer mit dem Benutzernamen "testuser", Passwort "securepassword123" und deaktivierter 2FA existiert.
  - **Anfrage:**
    ```json
    {
      "username": "testuser",
      "password": "securepassword123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 200
    - Antwort:
      ```json
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "requires2FA": false
      }
      ```

#### 7.1.4. POST /api/auth/2fa/enroll - 2FA-Anmeldung

**Beschreibung:** Testet die Aktivierung der Zwei-Faktor-Authentifizierung für einen Benutzer.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein Benutzer mit der ID 1 existiert.
- **Anfrage:**
  ```json
  {
    "userId": 1,
    "phoneNumber": "+1234567890"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "2FA enrolled successfully"
    }
    ```
  - Der Benutzer hat 2FA aktiviert und die Telefonnummer gespeichert.

**Edge-Cases:**
- **Nicht existierender Benutzer:**
  - **Anfrage:**
    ```json
    {
      "userId": 999,
      "phoneNumber": "+1234567890"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

#### 7.1.5. POST /api/auth/2fa/send-code - 2FA-Code senden

**Beschreibung:** Testet das Senden eines 2FA-Codes an die registrierte Telefonnummer eines Benutzers.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein Benutzer mit der ID 1, aktivierter 2FA und registrierter Telefonnummer existiert.
- **Anfrage:**
  ```json
  {
    "userId": 1
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "2FA code sent successfully"
    }
    ```
  - Ein 2FA-Code wurde generiert, gespeichert und "gesendet" (in der Implementierung wird er nur geloggt).

**Edge-Cases:**
- **Benutzer ohne 2FA:**
  - **Vorbedingung:** Ein Benutzer mit der ID 1 und deaktivierter 2FA existiert.
  - **Anfrage:**
    ```json
    {
      "userId": 1
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found or 2FA not enabled"
      }
      ```

- **Benutzer ohne Telefonnummer:**
  - **Vorbedingung:** Ein Benutzer mit der ID 1 und aktivierter 2FA aber ohne registrierte Telefonnummer existiert.
  - **Anfrage:**
    ```json
    {
      "userId": 1
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Phone number not set for user"
      }
      ```

#### 7.1.6. POST /api/auth/2fa/verify - 2FA-Code verifizieren

**Beschreibung:** Testet die Verifizierung eines 2FA-Codes.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein Benutzer mit der ID 1 existiert, ein gültiger 2FA-Code wurde generiert und gespeichert.
- **Anfrage:**
  ```json
  {
    "userId": 1,
    "code": "123456"  // Der zuvor generierte Code
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "message": "2FA verified successfully"
    }
    ```
  - Der Code wurde gelöscht und ein JWT-Token wurde generiert.

**Edge-Cases:**
- **Ungültiger Code:**
  - **Vorbedingung:** Ein Benutzer mit der ID 1 existiert, ein gültiger 2FA-Code wurde generiert und gespeichert.
  - **Anfrage:**
    ```json
    {
      "userId": 1,
      "code": "654321"  // Ein falscher Code
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid code"
      }
      ```

- **Abgelaufener Code:**
  - **Vorbedingung:** Ein Benutzer mit der ID 1 existiert, ein 2FA-Code wurde generiert und gespeichert, ist aber abgelaufen (älter als 5 Minuten).
  - **Anfrage:**
    ```json
    {
      "userId": 1,
      "code": "123456"  // Der abgelaufene Code
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "No valid code found for user"
      }
      ```

#### 7.1.7. GET /api/auth/user - Benutzerinformationen abrufen

**Beschreibung:** Testet das Abrufen der eigenen Benutzerinformationen mit einem gültigen JWT-Token.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Ein gültiger JWT-Token für einen Benutzer mit der ID 1 existiert.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: GET
  - Pfad: `/api/auth/user`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "id": 1,
      "username": "testuser",
      "real_name": "Test User",
      "email": "test@example.com",
      "phone_number": "+1234567890",
      "is_2fa_enabled": true,
      "created_at": "2023-01-01T00:00:00Z"
    }
    ```

**Edge-Cases:**
- **Ungültiger Token:**
  - **Anfrage:**
    - Header: `Authorization: Bearer invalidtoken`
    - Methode: GET
    - Pfad: `/api/auth/user`
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Invalid token"
      }
      ```

- **Fehlender Token:**
  - **Anfrage:**
    - Header: (kein Authorization-Header)
    - Methode: GET
    - Pfad: `/api/auth/user`
  - **Erwartetes Ergebnis:**
    - Statuscode: 401
    - Antwort:
      ```json
      {
        "error": "Access token required"
      }
      ```

### 7.2 Test-Suite Management

#### 7.2.1. GET /api/test-suites - Alle Test-Suites abrufen

**Beschreibung:** Testet das Abrufen aller Test-Suites aus der Datenbank.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Es existieren Test-Suites in der Datenbank.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: GET
  - Pfad: `/api/test-suites`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    [
      {
        "id": 1,
        "name": "Login Tests",
        "description": "Tests for the login functionality",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "Registration Tests",
        "description": "Tests for the registration functionality",
        "created_at": "2023-01-02T00:00:00Z",
        "updated_at": "2023-01-02T00:00:00Z"
      }
    ]
    ```

**Edge-Cases:**
- **Keine Test-Suites vorhanden:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Es existieren keine Test-Suites in der Datenbank.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/test-suites`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200
    - Antwort:
      ```json
      []
      ```

#### 7.2.2. POST /api/test-suites - Neue Test-Suite erstellen

**Beschreibung:** Testet die Erstellung einer neuen Test-Suite.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen.
- **Anfrage:**
  ```json
  {
    "name": "Password Reset Tests",
    "description": "Tests for the password reset functionality"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "id": 3
    }
    ```
  - Die neue Test-Suite ist in der Datenbank gespeichert.

**Edge-Cases:**
- **Fehlende Pflichtfelder:**
  - **Anfrage:**
    ```json
    {
      "description": "Tests for the password reset functionality"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 500 (da keine explizite Validierung im Code zu sehen ist, wird der Serverfehler auftreten)

#### 7.2.3. PUT /api/test-suites/:id - Test-Suite aktualisieren

**Beschreibung:** Testet die Aktualisierung einer bestehenden Test-Suite.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert.
- **Anfrage:**
  ```json
  {
    "name": "Updated Login Tests",
    "description": "Updated tests for the login functionality"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Updated"
    }
    ```
  - Die Test-Suite mit der ID 1 wurde in der Datenbank aktualisiert.

**Edge-Cases:**
- **Nicht existierende Test-Suite:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "name": "Updated Login Tests",
      "description": "Updated tests for the login functionality"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz im Code zu sehen ist)

#### 7.2.4. DELETE /api/test-suites/:id - Test-Suite löschen

**Beschreibung:** Testet das Löschen einer bestehenden Test-Suite.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: DELETE
  - Pfad: `/api/test-suites/1`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Deleted"
    }
    ```
  - Die Test-Suite mit der ID 1 wurde aus der Datenbank gelöscht.

**Edge-Cases:**
- **Nicht existierende Test-Suite:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: DELETE
    - Pfad: `/api/test-suites/999`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz im Code zu sehen ist)

#### 7.2.5. GET /api/test-suites/:suiteId/tests - Tests einer Test-Suite abrufen

**Beschreibung:** Testet das Abrufen aller Tests einer bestimmten Test-Suite.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert und enthält Tests.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: GET
  - Pfad: `/api/test-suites/1/tests`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    [
      {
        "id": 1,
        "suite_id": 1,
        "area": "Login Page",
        "short_name": "Valid Login",
        "manual_tasks": "Enter valid username and password",
        "expected_results": "User is logged in successfully",
        "is_mandatory": true,
        "status": "pending",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ]
    ```

**Edge-Cases:**
- **Keine Tests vorhanden:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert, enthält aber keine Tests.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/test-suites/1/tests`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200
    - Antwort:
      ```json
      []
      ```

- **Nicht existierende Test-Suite:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/test-suites/999/tests`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200
    - Antwort:
      ```json
      []
      ```

#### 7.2.6. POST /api/test-suites/:suiteId/tests - Neuen Test in einer Test-Suite erstellen

**Beschreibung:** Testet die Erstellung eines neuen Tests innerhalb einer Test-Suite.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert.
- **Anfrage:**
  ```json
  {
    "area": "Login Page",
    "short_name": "Invalid Login",
    "manual_tasks": "Enter invalid username and password",
    "expected_results": "Error message is displayed",
    "is_mandatory": false
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "id": 2
    }
    ```
  - Der neue Test ist in der Datenbank gespeichert und der Test-Suite mit der ID 1 zugeordnet.

**Edge-Cases:**
- **Nicht existierende Test-Suite:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "area": "Login Page",
      "short_name": "Invalid Login",
      "manual_tasks": "Enter invalid username and password",
      "expected_results": "Error message is displayed",
      "is_mandatory": false
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz der Suite im Code zu sehen ist)

#### 7.2.7. PUT /api/tests/:id - Test aktualisieren

**Beschreibung:** Testet die Aktualisierung eines bestehenden Tests.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Ein Test mit der ID 1 existiert.
- **Anfrage:**
  ```json
  {
    "area": "Login Page",
    "short_name": "Valid Login - Updated",
    "manual_tasks": "Enter valid username and password",
    "expected_results": "User is logged in successfully",
    "is_mandatory": true,
    "status": "passed"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Updated"
    }
    ```
  - Der Test mit der ID 1 wurde in der Datenbank aktualisiert.

**Edge-Cases:**
- **Nicht existierender Test:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Ein Test mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "area": "Login Page",
      "short_name": "Valid Login - Updated",
      "manual_tasks": "Enter valid username and password",
      "expected_results": "User is logged in successfully",
      "is_mandatory": true,
      "status": "passed"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz im Code zu sehen ist)

#### 7.2.8. DELETE /api/tests/:id - Test löschen

**Beschreibung:** Testet das Löschen eines bestehenden Tests.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Ein Test mit der ID 1 existiert.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: DELETE
  - Pfad: `/api/tests/1`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Deleted"
    }
    ```
  - Der Test mit der ID 1 wurde aus der Datenbank gelöscht.

**Edge-Cases:**
- **Nicht existierender Test:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Ein Test mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: DELETE
    - Pfad: `/api/tests/999`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz im Code zu sehen ist)

#### 7.2.9. POST /api/test-suites/:id/run - Test-Suite ausführen

**Beschreibung:** Testet das Starten der Ausführung einer Test-Suite (setzt alle Tests auf "in_progress").

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert und enthält Tests.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: POST
  - Pfad: `/api/test-suites/1/run`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Suite started"
    }
    ```
  - Alle Tests der Test-Suite mit der ID 1 haben den Status "in_progress".

**Edge-Cases:**
- **Nicht existierende Test-Suite:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: POST
    - Pfad: `/api/test-suites/999/run`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200 (da keine explizite Prüfung auf Existenz im Code zu sehen ist)

#### 7.2.10. POST /api/test-suites/:id/start-execution - Test-Suite-Ausführung starten

**Beschreibung:** Testet das Starten einer neuen Ausführung einer Test-Suite mit Anwendung und Version.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1, eine Anwendung mit der ID 1 und eine Version mit der ID 1 existieren. Die Test-Suite enthält Tests.
- **Anfrage:**
  ```json
  {
    "execution_name": "Execution 1",
    "tester_name": "Test User",
    "application_id": 1,
    "version_id": 1
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "suite_execution_id": 1,
      "message": "Suite execution started",
      "test_count": 1
    }
    ```
  - Eine neue Suite-Ausführung wurde in der Datenbank erstellt.
  - Für jeden Test in der Suite wurde ein Test-Ausführungsdatensatz erstellt.
  - Alle Tests der Suite haben den Status "pending".

**Edge-Cases:**
- **Test-Suite ohne Tests:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1, eine Anwendung mit der ID 1 und eine Version mit der ID 1 existieren. Die Test-Suite enthält keine Tests.
  - **Anfrage:**
    ```json
    {
      "execution_name": "Execution 1",
      "tester_name": "Test User",
      "application_id": 1,
      "version_id": 1
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Cannot start execution: No tests defined for this test suite. Please add tests before executing."
      }
      ```

- **Nicht existierende Anwendung:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 existiert. Eine Anwendung mit der ID 999 existiert nicht. Eine Version mit der ID 1 existiert.
  - **Anfrage:**
    ```json
    {
      "execution_name": "Execution 1",
      "tester_name": "Test User",
      "application_id": 999,
      "version_id": 1
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Application not found"
      }
      ```

- **Nicht existierende Version:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat die notwendigen Berechtigungen. Eine Test-Suite mit der ID 1 und eine Anwendung mit der ID 1 existieren. Eine Version mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "execution_name": "Execution 1",
      "tester_name": "Test User",
      "application_id": 1,
      "version_id": 999
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Version not found or does not belong to the specified application"
      }
      ```

### 7.3 Benutzerverwaltung

#### 7.3.1. GET /api/admin/users - Alle Benutzer abrufen

**Beschreibung:** Testet das Abrufen einer Liste aller Benutzer für Administratoren.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte (Berechtigung "administration:read"). Es existieren Benutzer in der Datenbank.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: GET
  - Pfad: `/api/admin/users`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    [
      {
        "id": 1,
        "username": "admin",
        "real_name": "Admin User",
        "email": "admin@example.com",
        "phone_number": "+1234567890",
        "is_2fa_enabled": true,
        "created_at": "2023-01-01T00:00:00Z",
        "roles": ["Administrator"]
      },
      {
        "id": 2,
        "username": "testuser",
        "real_name": "Test User",
        "email": "test@example.com",
        "phone_number": null,
        "is_2fa_enabled": false,
        "created_at": "2023-01-02T00:00:00Z",
        "roles": ["Tester"]
      }
    ]
    ```

**Edge-Cases:**
- **Keine Benutzer vorhanden:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Es existieren keine Benutzer in der Datenbank.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/admin/users`
  - **Erwartetes Ergebnis:**
    - Statuscode: 200
    - Antwort:
      ```json
      []
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/admin/users`
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

#### 7.3.2. GET /api/admin/users/:id - Benutzerdetails abrufen

**Beschreibung:** Testet das Abrufen der Details eines bestimmten Benutzers.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 1 existiert.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: GET
  - Pfad: `/api/admin/users/1`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "id": 1,
      "username": "admin",
      "real_name": "Admin User",
      "email": "admin@example.com",
      "phone_number": "+1234567890",
      "is_2fa_enabled": true,
      "created_at": "2023-01-01T00:00:00Z",
      "roles": ["Administrator"]
    }
    ```

**Edge-Cases:**
- **Nicht existierender Benutzer:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/admin/users/999`
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

- **Ungültige Benutzer-ID:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/admin/users/invalid`
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid user ID"
      }
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: GET
    - Pfad: `/api/admin/users/1`
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

#### 7.3.3. PUT /api/admin/users/:id/deactivate - Benutzerkonto deaktivieren

**Beschreibung:** Testet das Deaktivieren (Löschen) eines Benutzerkontos durch einen Administrator.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte (Berechtigung "administration:write"). Ein Benutzer mit der ID 2 existiert.
- **Anfrage:**
  ```json
  {
    "is_active": false
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "User account deactivated successfully"
    }
    ```
  - Der Benutzer mit der ID 2 wurde aus der Datenbank gelöscht.
  - Alle zugehörigen Datensätze (Rollen, Berechtigungen, 2FA-Codes) wurden ebenfalls gelöscht.

**Edge-Cases:**
- **Versuch, eigenes Konto zu deaktivieren:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Der authentifizierte Benutzer hat die ID 1.
  - **Anfrage:**
    ```json
    {
      "is_active": false
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Cannot deactivate your own account"
      }
      ```

- **Nicht existierender Benutzer:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "is_active": false
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

- **Ungültige Benutzer-ID:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "is_active": false
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid user ID"
      }
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "is_active": false
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

#### 7.3.4. PUT /api/admin/users/:id/reset-password - Benutzerpasswort zurücksetzen

**Beschreibung:** Testet das Zurücksetzen des Passworts eines Benutzers durch einen Administrator.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte (Berechtigung "administration:write"). Ein Benutzer mit der ID 2 existiert.
- **Anfrage:**
  ```json
  {
    "newPassword": "newpassword123"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "Password reset successfully"
    }
    ```
  - Das Passwort des Benutzers mit der ID 2 wurde aktualisiert.

**Edge-Cases:**
- **Zu kurzes Passwort:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 2 existiert.
  - **Anfrage:**
    ```json
    {
      "newPassword": "123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Password must be at least 6 characters long"
      }
      ```

- **Nicht existierender Benutzer:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "newPassword": "newpassword123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

- **Ungültige Benutzer-ID:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "newPassword": "newpassword123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid user ID"
      }
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "newPassword": "newpassword123"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

#### 7.3.5. PUT /api/admin/users/:id/reset-2fa - 2FA eines Benutzers zurücksetzen

**Beschreibung:** Testet das Zurücksetzen der Zwei-Faktor-Authentifizierung eines Benutzers durch einen Administrator.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte (Berechtigung "administration:write"). Ein Benutzer mit der ID 2 und aktivierter 2FA existiert.
- **Anfrage:**
  - Header: `Authorization: Bearer <token>`
  - Methode: PUT
  - Pfad: `/api/admin/users/2/reset-2fa`
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "2FA reset successfully"
    }
    ```
  - Die 2FA des Benutzers mit der ID 2 wurde deaktiviert.
  - Die Telefonnummer des Benutzers wurde gelöscht.
  - Alle gespeicherten 2FA-Codes für diesen Benutzer wurden gelöscht.

**Edge-Cases:**
- **Nicht existierender Benutzer:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 999 existiert nicht.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: PUT
    - Pfad: `/api/admin/users/999/reset-2fa`
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

- **Ungültige Benutzer-ID:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: PUT
    - Pfad: `/api/admin/users/invalid/reset-2fa`
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid user ID"
      }
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    - Header: `Authorization: Bearer <token>`
    - Methode: PUT
    - Pfad: `/api/admin/users/2/reset-2fa`
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

#### 7.3.6. PUT /api/admin/users/:id/update-info - Benutzerinformationen aktualisieren

**Beschreibung:** Testet das Aktualisieren der real_name und email eines Benutzers durch einen Administrator.

**Erfolgreicher Testfall:**
- **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte (Berechtigung "administration:write"). Ein Benutzer mit der ID 2 existiert.
- **Anfrage:**
  ```json
  {
    "real_name": "Updated Test User",
    "email": "updated@example.com"
  }
  ```
- **Erwartetes Ergebnis:**
  - Statuscode: 200
  - Antwort:
    ```json
    {
      "message": "User information updated successfully"
    }
    ```
  - Die real_name und email des Benutzers mit der ID 2 wurden aktualisiert.

**Edge-Cases:**
- **Ungültiges E-Mail-Format:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 2 existiert.
  - **Anfrage:**
    ```json
    {
      "real_name": "Updated Test User",
      "email": "invalid-email"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid email format"
      }
      ```

- **Doppelte E-Mail:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 2 existiert. Ein anderer Benutzer mit der E-Mail "existing@example.com" existiert bereits.
  - **Anfrage:**
    ```json
    {
      "real_name": "Updated Test User",
      "email": "existing@example.com"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "A user with this email already exists"
      }
      ```

- **Nicht existierender Benutzer:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte. Ein Benutzer mit der ID 999 existiert nicht.
  - **Anfrage:**
    ```json
    {
      "real_name": "Updated Test User",
      "email": "updated@example.com"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 404
    - Antwort:
      ```json
      {
        "error": "User not found"
      }
      ```

- **Ungültige Benutzer-ID:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert und hat Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "real_name": "Updated Test User",
      "email": "updated@example.com"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 400
    - Antwort:
      ```json
      {
        "error": "Invalid user ID"
      }
      ```

- **Unzureichende Berechtigungen:**
  - **Vorbedingung:** Der Benutzer ist authentifiziert, hat aber keine Administrationsrechte.
  - **Anfrage:**
    ```json
    {
      "real_name": "Updated Test User",
      "email": "updated@example.com"
    }
    ```
  - **Erwartetes Ergebnis:**
    - Statuscode: 403
    - Antwort:
      ```json
      {
        "error": "Insufficient permissions"
      }
      ```

### 7.4 Rollenverwaltung
- **GET /api/admin/roles**
  - Testet das Abrufen der Liste aller Rollen
- **POST /api/admin/roles**
  - Testet das Erstellen einer neuen Rolle
- **PUT /api/admin/roles/:id**
  - Testet das Aktualisieren einer vorhandenen Rolle
- **DELETE /api/admin/roles/:id**
  - Testet das Löschen einer Rolle
- **GET /api/admin/roles/:id/permissions**
  - Testet das Abrufen der Berechtigungen einer bestimmten Rolle
- **POST /api/admin/roles/:id/permissions**
  - Testet das Zuweisen von Berechtigungen zu einer Rolle

### 7.5 Berechtigungsverwaltung
- **GET /api/admin/permissions**
  - Testet das Abrufen der Liste aller Berechtigungen
- **GET /api/admin/permissions/:id**
  - Testet das Abrufen der Details einer bestimmten Berechtigung

### 7.6 Benutzerzuweisungen
- **GET /api/admin/users/:id/roles**
  - Testet das Abrufen der Rollen eines bestimmten Benutzers
- **POST /api/admin/users/:id/roles**
  - Testet das Zuweisen einer Rolle zu einem Benutzer
- **DELETE /api/admin/users/:id/roles/:role_id**
  - Testet das Entfernen einer Rolle von einem Benutzer
- **GET /api/admin/users/:id/permissions**
  - Testet das Abrufen der direkten Berechtigungen eines bestimmten Benutzers
- **POST /api/admin/users/:id/permissions**
  - Testet das Zuweisen einer direkten Berechtigung zu einem Benutzer
- **DELETE /api/admin/users/:id/permissions/:permission_id**
  - Testet das Entfernen einer direkten Berechtigung von einem Benutzer

### 7.7 Teststruktur für API-Endpunkte
Die API-Tests werden in der folgenden Struktur organisiert:
- `server/tests/integration/admin/` - Tests für die Administrations-API
  - `users.test.ts` - Tests für Benutzerverwaltung
  - `roles.test.ts` - Tests für Rollenverwaltung
  - `permissions.test.ts` - Tests für Berechtigungsverwaltung
  - `user-assignments.test.ts` - Tests für Benutzerzuweisungen

### 7.8 Testdaten und Fixtures
Für die API-Tests werden folgende Testdaten und Fixtures verwendet:
- Vordefinierte Benutzer mit verschiedenen Rollen und Berechtigungen
- Vordefinierte Rollen und Berechtigungen
- Testdaten für alle CRUD-Operationen

Dieses Konzept bietet einen ausgewogenen Ansatz für alle Testarten mit einem Fokus auf Einfachheit und Wartbarkeit, ideal für Entwickler, die neu im Bereich Testing sind.

## 8. Implementierungsplan für API-Tests

### 8.1. Testverzeichnisstruktur

Die API-Tests im Server-Bereich sind entsprechend ihrem Typ in verschiedene Verzeichnisse organisiert:

- `server/tests/unit/` - Unit-Tests für einzelne Funktionen und Module
- `server/tests/integration/` - Integrationstests für API-Endpunkte und Datenbankoperationen
- `server/tests/e2e/` - End-to-End-Tests für komplette Benutzerflows

Zusätzliche Hilfsdateien:
- `server/tests/setup-tests.ts` - Globale Testeinrichtung und Mock-Konfiguration
- `server/tests/test-helpers.ts` - Hilfsfunktionen zum Erstellen und Löschen von Testdaten

### 8.2. Benötigte Mocks

Für die API-Tests werden verschiedene Mocks verwendet, um externe Abhängigkeiten zu simulieren:

- **SMS-Simulation**: Die `sendSMS`-Funktion wird gemockt, um das Senden von SMS während der Tests zu vermeiden.
  ```typescript
  originalModule.sendSMS = jest.fn().mockResolvedValue(true);
  ```
- **Zeitfunktionen**: `Date.now` wird gemockt, um konsistente Zeitstempel in den Tests zu gewährleisten.
  ```typescript
  global.Date.now = jest.fn().mockReturnValue(new Date('2023-01-01T00:00:00Z').getTime());
  ```

Diese Mocks werden in der `setup-tests.ts`-Datei konfiguriert, die vor jedem Testlauf ausgeführt wird.

### 8.3. Datenbankfixtures

Die Testdaten werden mit Hilfe von Hilfsfunktionen in `test-helpers.ts` verwaltet:

- `createTestUser()`: Erstellt einen Testbenutzer in der Datenbank
- `createTestSuite()`: Erstellt eine Test-Suite
- `createTest()`: Erstellt einen Test innerhalb einer Test-Suite
- `createApplication()`: Erstellt eine Anwendung
- `createVersion()`: Erstellt eine Version einer Anwendung

Vor und nach jedem Test werden alle Testdaten automatisch gelöscht, um eine saubere Testumgebung zu gewährleisten:
```typescript
// In setup-tests.ts
beforeEach(() => {
  deleteAllTestData();
});

afterEach(() => {
  deleteAllTestData();
});
```

Die Funktion `deleteAllTestData()` löscht alle Datensätze in der richtigen Reihenfolge, um die Fremdschlüsselbeschränkungen der Datenbank zu respektieren.

### 8.4. Integration mit dem Jest-Test-Framework

Die API-Tests verwenden Jest als Haupttest-Framework mit folgender Konfiguration (`server/jest.config.js`):

- **Testumgebung**: Node.js
- **Transformierung**: TypeScript-Dateien werden mit `ts-jest` transformiert
- **Testdateien**: Alle Dateien mit der Endung `.test.ts` im `tests`-Verzeichnis werden ausgeführt
- **Setup-Datei**: `setup-tests.ts` wird vor allen Tests ausgeführt, um Mocks zu konfigurieren und die Testdatenbank zu initialisieren

Die Tests können mit dem Befehl `npm test` im Server-Verzeichnis ausgeführt werden.
Bitte melde den Abschluss mit attempt_completion.