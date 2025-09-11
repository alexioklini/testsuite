# API-Test Implementierungsplan

## 1. Teststruktur

Die Tests werden in folgende Kategorien unterteilt:

### 1.1 Unit Tests (`server/tests/unit`)
- Testen einzelne Funktionen und Module isoliert
- Mocks werden verwendet, um externe Abhängigkeiten zu simulieren
- Beispiele:
  - Authentifizierungsfunktionen (bcrypt, JWT)
  - Validierungsfunktionen
  - Hilfsfunktionen (z.B. SMS-Simulation)

### 1.2 Integration Tests (`server/tests/integration`)
- Testen die Interaktion zwischen verschiedenen Modulen
- Verwenden einer Testdatenbank
- Beispiele:
  - API-Endpunkte mit Supertest
  - Datenbankoperationen (CRUD)
  - Middleware (Authentifizierung, Fehlerbehandlung)

### 1.3 End-to-End Tests (`server/tests/e2e`)
- Testen komplette Benutzerflows
- Verwenden eines vollständigen Testservers
- Beispiele:
  - Komplette Benutzerflows (Login bis Testausführung)
  - Komplexe Workflows über mehrere Endpunkte

## 2. Benötigte Mocks

### 2.1 Datenbank-Mocks
- Für Unit-Tests werden Datenbankaufrufe gemockt
- Verwendung von `jest.mock()` für das `better-sqlite3`-Modul
- Erstellung von Mock-Daten für verschiedene Testfälle

### 2.2 Dateisystem-Mocks
- Für Tests, die Dateioperationen durchführen
- Verwendung von `mock-fs` oder ähnlichen Bibliotheken
- Mocken von `fs`, `path` und `multer`

### 2.3 Externe Service-Mocks
- Mocken des SMS-Services (`sendSMS`)
- Mocken von Zeitfunktionen (`Date.now()`)
- Mocken von `crypto`-Funktionen

## 3. Datenbankfixtures

### 3.1 Testdatenbank
- Verwendung einer separaten SQLite-Datenbank für Tests
- Automatische Erstellung und Löschung der Testdatenbank vor/ nach Tests
- Verwendung von `beforeEach` und `afterEach` in Jest

### 3.2 Fixtures
- Vordefinierte Datensätze für verschiedene Testfälle
- Beispiele:
  - Testbenutzer mit verschiedenen Rollen und Berechtigungen
  - Test-TestSuites und Tests
  - Testanwendungen und -versionen
  - Test-Suite-Ausführungen

### 3.3 Datenbank-Hilfsfunktionen
- Funktionen zum Einrichten und Zurücksetzen der Testdatenbank
- Funktionen zum Erstellen und Löschen von Testdaten
- Funktionen zum Überprüfen des Datenbankzustands nach Tests

## 4. Integration mit Jest

### 4.1 Jest-Konfiguration
- Anpassung der `jest.config.js`, um Tests im `server/tests`-Verzeichnis zu finden
- Konfiguration für TypeScript-Tests
- Setup und Teardown-Skripte

### 4.2 Test-Setup
- Globales Setup für gemeinsame Konfigurationen
- Environment-Variablen für Tests
- Mock-Implementierungen für externe Abhängigkeiten

### 4.3 Testausführung
- npm-Skripte für verschiedene Testarten:
  - `npm test` - Führt alle Tests aus
  - `npm run test:unit` - Führt nur Unit-Tests aus
  - `npm run test:integration` - Führt nur Integrationstests aus
  - `npm run test:e2e` - Führt nur E2E-Tests aus
  - `npm run test:watch` - Führt Tests im Watch-Modus aus

## 5. Testabdeckung und Qualitätsmetriken

### 5.1 Anfängliche Ziele
- Testabdeckung: 60% für kritische Pfade (Authentifizierung, CRUD-Operationen)
- Codequalität: ESLint/Prettier für Konsistenz
- Maximale Komplexität: Cyclomatic Complexity < 10 pro Funktion

### 5.2 Qualitätsmetriken
- Testlaufzeit: < 30 Sekunden für Unit-Tests
- Fehlerdichte: < 1 kritischer Fehler pro 1000 LOC
- Teststabilität: > 95% Bestanden-Rate in wiederholten Ausführungen

### 5.3 Priorisierung
1. Authentifizierung und Autorisierung
2. CRUD-Operationen für Test-Suites und Tests
3. Testausführungsfunktionen
4. Datei-Upload und -Verwaltung
5. Anwendungs- und Versionsverwaltung

## 6. Nächste Schritte

1. Erstellung des `server/tests`-Verzeichnisses und der Unterverzeichnisse
2. Anpassung der Jest-Konfiguration
3. Erstellung von gemeinsamen Hilfsfunktionen und Mocks
4. Implementierung von Beispieltests für kritische Funktionen
5. Einrichtung von npm-Skripten für Testausführung
6. schrittweise Erweiterung der Testabdeckung