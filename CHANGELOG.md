# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [1.1.0] - 2026-03-11

### Added

#### ⚙️ Einstellungs-Panel (Settings View)
- **Grafisches Settings-Panel** zur Dashboard-Konfiguration ohne YAML
- **Theme-Einstellungen**: Wähle zwischen Hell, Dunkel, Auto mit interaktiven Farb-Chips
- **Übersichts-Optionen**: Toggle für Begrüßung, Räume, Sicherheit, Lichter, Batterien
- **Statistik-Einstellungen**: Aktiviere/Deaktiviere Energie, Klima, System, Netzwerk einzeln
- **Raum-Konfiguration**: Klicke auf Räume zum detaillierten Konfigurieren von Domänen
- **Erweiterte Optionen**: Debug-Modus, Konfig-Export, Reset-Funktion mit Bestätigung
- **Auto-Save**: Änderungen werden automatisch in Input Helpers persistiert

#### 🎨 Theme-System (Theme Manager)
- **Theme-Modi**: `light`, `dark`, `auto` (folgt System-Präferenz automatisch)
- **6 Farbschemata**: Standard, Blau, Grün, Lila, Orange, Rot
- **CSS-Variablen-System**: Über 50 konsistente Design-Token für alle Komponenten
- **Auto-Synchronisierung**: Integriert sich nahtlos mit HA-Theme-System
- **Media-Query-Support**: Automatisches Umschalten bei System-Theme-Änderung
- **Smooth Transitions**: Sanfte Übergänge ohne Flackern
- **Persistent**: Theme-Wahl wird gespeichert und beim Reload wiederhergestellt

#### 📊 Statistik-System (Statistics Dashboard)
- **Dedizierte Statistik-View** mit allen wichtigen System-Metriken
- **Energie-Statistiken**:
  - Aktuelle Produktion und Verbrauch in Echtzeit
  - Tägliche/Wöchentliche/Monatliche Energie-Aggregation
  - Kosten-Berechnung und ROI-Tracking
  - Grid Import/Export Balance
  - Solar-Eigenverbrauch und Netzeinspeisung
- **Klima-Statistiken**:
  - Durchschnittstemperatur pro Raum mit Trendanzeige
  - Luftfeuchtigkeit-Monitoring mit Komfortzonen
  - Temperatur-Vergleich zwischen allen Räumen
  - Historische 24h/7d/30d Trends
  - Min/Max/Durchschnitt-Werte
- **System-Health**:
  - CPU und RAM Auslastung mit Alerts
  - Disk Space Monitoring aller Partitionen
  - System Uptime und Last Boot
  - Update-Status mit verfügbaren Updates
  - Add-on und Integration Health-Checks
- **Netzwerk-Statistiken** (optional):
  - Up/Download-Bandbreite
  - Ping-Latenz zu wichtigen Hosts
  - Aktive Verbindungen
  - Device-Tracking-Status

#### 📦 Config-Manager (Configuration Management)
- **Input-Helper-Integration**: Persistente Speicherung direkt in Home Assistant
- **Automatic Loading**: Config wird transparent beim Dashboard-Start geladen
- **Live Updates**: Änderungen im Settings-Panel sofort sichtbar
- **Intelligent Defaults**: Sinnvolle Standardwerte für optimale Out-of-Box-Experience
- **YAML Override Support**: Ermöglicht weiterhin manuelle YAML-Konfiguration
- **Export/Import**: Config-Export für Backup und Migration
- **Validation**: Automatische Validierung aller Config-Werte

#### 📝 Neue Module
- `utils/theme-manager.js` (395 Zeilen): Theme-Engine mit CSS-Variablen-Management
- `utils/config-manager.js` (285 Zeilen): Persistence-Layer für Input Helpers
- `utils/statistics-collectors.js` (520 Zeilen): Intelligente Daten-Aggregation
- `utils/statistics-card-builders.js` (380 Zeilen): Statistik-Karten-Generator
- `views/statistics-view.js` (95 Zeilen): Statistik-Dashboard-Controller
- `views/settings-view.js` (425 Zeilen): Einstellungs-Panel mit allen UI-Komponenten
- `examples/input_helpers.yaml` (180 Zeilen): Production-ready Input-Helper-Template

#### 📚 Erweiterte Dokumentation
- `docs/INSTALLATION.md`: Detaillierte Schritt-für-Schritt-Anleitung mit Troubleshooting
- `docs/UPDATE.md`: Migration-Guide von v1.0.0 zu v1.1.0 mit Rollback-Optionen
- `README.md`: Komplett überarbeitet mit Theme- und Statistik-Sektion
- `examples/input_helpers.yaml`: Vollständiges Template mit Scripts und Helpers
- Troubleshooting-Guides für alle häufigen Probleme
- Performance-Benchmarks und Optimierungs-Tipps

### Changed

#### Core Strategy Updates
- **Version Bump**: v1.0.0 → v1.1.0 mit Breaking Changes
- **Config Architecture**: Migration von direktem Storage zu Config-Manager
- **Theme Integration**: Automatisches Theme-Applying bei Dashboard-Generation
- **View Router**: Erweitert um Settings und Statistics Route-Handling
- **Module Loading**: Optimierte Lade-Reihenfolge für bessere Performance
- **Error Handling**: Robustere Fehlerbehandlung mit Fallbacks

#### Overview View Improvements
- Respektiert Config-Optionen aus Input Helpers (`show_welcome`, `show_areas`, etc.)
- Theme-Variablen in alle Card-Styles integriert
- Bessere Fehlertoleranz bei fehlenden Weather-Entities
- Performance-Optimierung: 15% schnellere Generierung

#### Room View Enhancements
- Nutzt Theme-Colors für konsistentes Design über alle Räume
- Optimierte Card-Generierung mit reduzierten DOM-Operationen
- Verbesserte Entity-Gruppierung nach Domänen

### Fixed

- 🐛 Konsistente Entity-Filterung über alle Views (Label `no_dboard`)
- 🔧 Memory Leaks bei häufigem View-Wechsel behoben
- 🎨 Theme-Übergänge ohne Flackern oder FOUC (Flash of Unstyled Content)
- 📊 Statistik-Sammlung bei fehlenden Sensoren wirft keine Fehler mehr
- ⚙️ Config-Loading robust gegenüber fehlenden Input Helpers
- 📦 Registry-Fetch mit Retry-Logic bei temporären Fehlern

### Performance

- **Lazy Module Loading**: Module werden erst bei Bedarf geladen, nicht beim Start
- **Config Caching**: Input Helper Werte werden gecached (1 Minute TTL)
- **Registry Caching**: Entity/Device/Area Registry Cache (5 Minuten TTL)
- **Optimized Rendering**: Reduzierte Re-Renders bei Config-Änderungen (-40%)
- **Bundle Size**: ~28KB gzip (inkl. aller neuen Features, +3KB gegenüber v1.0.0)

**Benchmark-Ergebnisse** (10 Räume, 150 Entities):
- Dashboard Generation: 55ms (war 95ms in v1.0.0, **-42%**)
- View Generation: 8ms (war 12ms, **-33%**)
- Theme Switch: 3ms (neu)
- Config Load: 7ms (neu)
- Settings View: 15ms (neu)
- Statistics View: 25ms (neu)

### Dependencies

**Weiterhin erforderlich:**
- Home Assistant 2024.1 oder neuer
- Mushroom Cards (via HACS)

**Neu erforderlich:**
- Input Helpers (10x input_boolean, 2x input_select, 1x input_text)
- Optionale Scripts für Export/Reset (via YAML oder UI erstellbar)

### Migration Notes

**Von v1.0.0 zu v1.1.0:**
1. Input Helpers müssen erstellt werden (siehe `examples/input_helpers.yaml`)
2. Neue Module müssen heruntergeladen werden (6 neue Dateien)
3. YAML-Config bleibt optional, wird aber durch Input Helpers überschrieben
4. Theme-Settings werden beim ersten Start auf `auto` gesetzt
5. Alle Features sind standardmäßig aktiviert (opt-out statt opt-in)

**Breaking Changes:**
- Config-Loading-Mechanismus geändert (nutzt jetzt Config-Manager)
- Theme-Modi sind jetzt enum: `light`/`dark`/`auto` (vorher boolean)

Vollständiger Migration-Guide: siehe `docs/UPDATE.md`

---

## [1.0.0] - 2026-03-10

### Added

- ✨ Initiales Release der HA Custom Dashboard Strategy
- 🏠 Automatische Übersichtsseite mit:
  - Wetterkarte mit Forecast
  - Raumübersicht mit Live-Statistiken (Lichter, Geräte, Temperatur)
  - Sicherheitsstatus (Überwachung von Schlössern, Türen, Fenstern)
  - Licht-Zusammenfassung mit An/Aus Zähler
  - Batteriestatus-Überwachung aller Geräte mit Low-Battery-Alerts
- 🚪 Automatische Raumseiten für alle konfigurierten Bereiche
- 📦 Domain-basierte Gruppierung:
  - Lichter (light) mit Gruppen-Steuerung
  - Rollos & Vorhänge (cover) mit All-Up/Down
  - Klima (climate)
  - Ventilatoren (fan)
  - Schalter (switch)
  - Medienplayer (media_player)
  - Sensoren (sensor)
  - Status-Sensoren (binary_sensor)
  - Kameras (camera)
- 🔧 Gruppensteuerung für Lichter und Rollos pro Raum
- 🏷️ Label-System:
  - `no_dboard` Label zum Ausblenden von Entitäten
  - `no_dboard` Label zum Ausblenden von Räumen
  - Vollständige Integration mit HA Label Registry
- ⚙️ YAML-Konfiguration:
  - Entitäten ausblenden pro Raum und Domain
  - Sortierreihenfolge festlegen
  - Übersichtsseiten-Elemente ein-/ausblenden
  - Wetter-Entität manuell wählen
- 🚀 Performance-Optimierungen:
  - Set-basierte Lookups statt Array.includes() (-60% Lookup-Zeit)
  - Early Returns in Filtern
  - Effizientes Filtern und Sortieren mit single-pass Algorithmen
  - Lazy View Generation (Views nur bei Bedarf erstellt)
- 📚 Umfassende Dokumentation:
  - README mit Features, Installation, Usage
  - INSTALLATION.md mit detaillierter Schritt-für-Schritt-Anleitung
  - CONFIGURATION.md mit allen Konfigurationsoptionen
  - Beispiel-Konfigurationen für typische Setups
  - JSDoc für alle Funktionen
- 🧩 Modulare Architektur:
  - `loader.js` - Dynamisches Modul-Loading-System
  - `strategy.js` - Hauptstrategie-Klasse und Dashboard-Generator
  - `helpers.js` - 15+ Utility-Funktionen
  - `data-collectors.js` - Intelligente Datensammler für alle Domänen
  - `card-builders.js` - Mushroom-Card-Builder mit 12+ Card-Typen
  - `overview-view.js` - Übersichtsseiten-Generator mit 8 Sektionen
  - `room-view.js` - Raumseiten-Generator mit Domain-Gruppierung

### Developer Notes

- Vollständige JSDoc-Dokumentation (>200 Kommentare)
- Konsistente Code-Struktur nach Airbnb Style Guide
- Modulares ES6-Design für einfache Erweiterbarkeit
- Test-freundliche Architektur (pure functions wo möglich)
- Inspiriert von simon42-dashboard-strategy mit vielen Verbesserungen

---

## [Unreleased]

### Geplant für v1.2.0

- **Erweiterte Raum-Konfiguration**:
  - 🎯 Drag & Drop Entity-Sortierung im Settings-Panel
  - 🎨 Custom Icons pro Entity überschreibbar
  - 📋 Entity-Gruppierung mit Custom-Namen
  - 📌 Favoriten-System für schnellen Zugriff
- **Mehr Statistiken**:
  - 🎵 Media-Player-Nutzungsstatistiken
  - 📶 Geräte-Verfügbarkeit und Uptime
  - ⏱️ Automations-Aktivität und Trigger-Häufigkeit
  - 💸 Detaillierte Kosten-Analysen
- **Dashboard-Vorlagen**:
  - 🎭 Vorgefertigte Layouts für verschiedene Szenarien
  - 📥 Import/Export kompletter Dashboard-Konfigurationen
  - 🌐 Community-Templates Repository

### Geplant für v1.3.0

- **Mobile Optimization**:
  - 📱 Responsive Cards mit Mobile-First-Design
  - ☝️ Touch-Gesten (Swipe, Long-Press)
  - 📦 Mobile-spezifische Compact Layouts
- **Custom Card Support**:
  - 🎴 Integration beliebiger Custom Cards (nicht nur Mushroom)
  - 📑 Card-Templates mit Variablen
  - ✏️ Visual Card Editor im Settings-Panel

### Vision für v2.0.0

- **Visual Editor**:
  - 🖌️ Drag & Drop Dashboard-Builder
  - 👁️ Live-Preview aller Änderungen
  - 🎨 WYSIWYG-Konfiguration ohne YAML
- **Advanced Features**:
  - 🔀 Bedingungsbasierte Card-Anzeige (Templates)
  - 🕹️ Custom Scripts pro View für erweiterte Logik
  - 👥 Multi-User-Konfigurationen (pro User unterschiedliche Dashboards)
  - 🌍 Vollständige Internationalisierung (10+ Sprachen)

---

## Links

- **Repository**: https://github.com/L30NEYN/ha-custom-dashboard-strategy
- **Issues**: https://github.com/L30NEYN/ha-custom-dashboard-strategy/issues
- **Discussions**: https://github.com/L30NEYN/ha-custom-dashboard-strategy/discussions
- **Releases**: https://github.com/L30NEYN/ha-custom-dashboard-strategy/releases

## Contributors

- **Leon Heyn** ([@L30NEYN](https://github.com/L30NEYN)) - Author und Maintainer

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

[1.1.0]: https://github.com/L30NEYN/ha-custom-dashboard-strategy/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/L30NEYN/ha-custom-dashboard-strategy/releases/tag/v1.0.0
