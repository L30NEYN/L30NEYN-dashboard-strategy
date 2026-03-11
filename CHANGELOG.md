# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [1.0.0] - 2026-03-11

### Added

- ✨ Initiales Release der HA Custom Dashboard Strategy
- 🏠 Automatische Übersichtsseite mit:
  - Wetterkarte
  - Raumübersicht mit Statistiken
  - Sicherheitsstatus (Überwachung von Schlössern, Türen, Fenstern)
  - Licht-Zusammenfassung
  - Batteriestatus-Überwachung
- 🚪 Automatische Raumseiten für alle konfigurierten Bereiche
- 📦 Domain-basierte Gruppierung:
  - Lichter (light)
  - Rollos & Vorhänge (cover)
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
- ⚙️ Konfigurationsoptionen:
  - Entitäten ausblenden pro Raum und Domain
  - Sortierreihenfolge festlegen
  - Übersichtsseiten-Elemente ein-/ausblenden
  - Wetter-Entität wählen
- 🚀 Performance-Optimierungen:
  - Set-basierte Lookups
  - Early Returns
  - Effizientes Filtern und Sortieren
- 📚 Umfassende Dokumentation:
  - README mit Features und Installation
  - INSTALLATION.md mit detaillierter Schritt-für-Schritt-Anleitung
  - CONFIGURATION.md mit allen Konfigurationsoptionen
  - Beispiel-Konfigurationen
- 🧑‍💻 Modulare Architektur:
  - `loader.js` - Dynamisches Modul-Loading
  - `strategy.js` - Hauptstrategie-Klasse
  - `helpers.js` - Utility-Funktionen
  - `data-collectors.js` - Datensammler
  - `card-builders.js` - Karten-Builder
  - `overview-view.js` - Übersichtsseiten-Generator
  - `room-view.js` - Raumseiten-Generator

### Developer Notes

- Vollständige JSDoc-Dokumentation
- Konsistente Code-Struktur
- Modulares Design für einfache Erweiterbarkeit
- Inspiriert von simon42-dashboard-strategy

## [Unreleased]

### Geplant

- ⚙️ Einstellungspanel (GUI-Konfiguration)
- 📦 HACS-Integration
- 🎨 Template-basierte Anpassungen
- 🔧 Erweiterte Gruppierungsoptionen
- 🎴 Custom Card Support
- 🌍 Mehrsprachigkeit (Deutsch/Englisch)
- 🎨 Theme-Support und Styling-Optionen
- 📊 Statistik-Karten
- 🔔 Benachrichtigungen-Übersicht
- 🤖 Automatisierungs-Shortcuts

---

[1.0.0]: https://github.com/L30NEYN/ha-custom-dashboard-strategy/releases/tag/v1.0.0
