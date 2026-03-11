# HACS Setup Guide

Anleitung zur Installation der **L30NEYN Dashboard Strategy** über HACS.

## 📦 Installation via HACS

### Voraussetzungen

- Home Assistant installiert und konfiguriert
- [HACS](https://hacs.xyz/) installiert und eingerichtet

### Schritt 1: Custom Repository hinzufügen

Da diese Strategy noch nicht im HACS-Default-Repository ist:

1. Öffne **HACS** in Home Assistant
2. Klicke auf **Frontend** (nicht Integrationen!)
3. Klicke auf das **⋮ Menü** (drei Punkte oben rechts)
4. Wähle **Benutzerdefinierte Repositories**
5. Füge hinzu:
   - **Repository**: `https://github.com/L30NEYN/L30NEYN-dashboard-strategy`
   - **Kategorie**: **Lovelace** (wichtig!)
6. Klicke **Hinzufügen**

### Schritt 2: Installieren

1. Suche in HACS nach **"L30NEYN Dashboard Strategy"**
2. Klicke auf die Karte
3. Klicke **Installieren**
4. Bestätige die Installation
5. **Neustart nicht nötig** - es werden nur Frontend-Dateien kopiert

### Schritt 3: Prüfen der Installation

Die Dateien werden nach `/config/www/community/l30neyn-dashboard-strategy/` installiert.

**Wichtige Dateien:**
- `l30neyn-dashboard-strategy.js` (Haupt-Loader)
- `dist/` (Alle Module)
- `examples/input_helpers.yaml` (Config-Template)

## ⚙️ Konfiguration

### Schritt 1: Input Helpers erstellen

**Option A: Via configuration.yaml (empfohlen)**

1. Kopiere den Inhalt von `examples/input_helpers.yaml`
2. Füge ihn in deine `configuration.yaml` ein
3. Starte Home Assistant neu

**Option B: Via UI**

Erstelle manuell über **Einstellungen → Geräte & Dienste → Helfer**:

**Input Booleans** (alle mit Prefix `l30neyn_`):
- `l30neyn_show_welcome`
- `l30neyn_show_areas`
- `l30neyn_show_security`
- `l30neyn_show_light_summary`
- `l30neyn_show_battery_status`
- `l30neyn_show_energy_stats`
- `l30neyn_show_climate_stats`
- `l30neyn_show_system_health`
- `l30neyn_show_network_stats`
- `l30neyn_debug_mode`

**Input Selects**:
- `l30neyn_theme_mode` (Optionen: `light`, `dark`, `auto`)
- `l30neyn_color_scheme` (Optionen: `default`, `blue`, `green`, `purple`, `orange`, `red`)

**Input Text**:
- `l30neyn_weather_entity` (leer lassen für Auto-Erkennung)

### Schritt 2: Mushroom Cards installieren

**Erforderliche Abhängigkeit!**

1. Öffne **HACS → Frontend**
2. Suche nach **"Mushroom"**
3. Installiere **"Mushroom Cards"**
4. Aktualisiere die Seite (Cache-Refresh: Strg+Shift+R)

### Schritt 3: Dashboard erstellen

1. Gehe zu **Einstellungen → Dashboards**
2. Klicke **Dashboard hinzufügen**
3. Wähle **"Neue Dashboard erstellen"**
4. Gib einen Namen ein (z.B. "L30NEYN Dashboard")
5. Klicke **Erstellen**
6. Öffne das neue Dashboard
7. Klicke **✏️ Bearbeiten** (rechts oben)
8. Klicke **⋮ → Raw-Konfiguration bearbeiten**
9. Füge hinzu:

```yaml
title: L30NEYN Dashboard
strategy:
  type: custom:ll-strategy-l30neyn-dashboard
```

**Wichtig:** Der `type` muss **exakt** `custom:ll-strategy-l30neyn-dashboard` sein!

10. Klicke **Speichern**
11. Klicke **Fertig**

## ✅ Verifikation

Prüfe ob alles funktioniert:

1. **Dashboard lädt**: Du siehst die Übersichtsseite
2. **Räume erscheinen**: Im Menü werden deine Areas angezeigt
3. **Einstellungen verfügbar**: "Einstellungen"-Tab im Menü
4. **Browser Console** (F12): Sollte zeigen:
   ```
   L30NEYN-DASHBOARD-STRATEGY v1.1.0
   [L30NEYN Strategy] Dashboard generated in XXms
   ```

## 🔧 Troubleshooting

### Dashboard lädt nicht

**Problem**: Weiße Seite oder Fehler

**Lösung**:
1. Öffne Browser Console (F12)
2. Suche nach Fehlermeldungen
3. Häufige Probleme:
   - **"Strategy not found"**: Cache-Refresh (Strg+Shift+R)
   - **"Mushroom not found"**: Mushroom Cards installieren
   - **404-Fehler**: HACS-Installation prüfen
   - **"Timeout waiting for strategy element"**: Strategy-Typ prüfen (muss `custom:ll-strategy-l30neyn-dashboard` sein)

### Input Helpers fehlen

**Problem**: Fehler beim Laden der Konfiguration

**Lösung**:
1. Prüfe ob alle Input Helpers existieren
2. Gehe zu **Entwicklerwerkzeuge → Zustände**
3. Suche nach `input_boolean.l30neyn_`
4. Falls nicht vorhanden: Input Helpers erstellen (siehe oben)

### Räume erscheinen nicht

**Problem**: Keine Raum-Views im Menü

**Lösung**:
1. Prüfe ob Areas in Home Assistant definiert sind
2. **Einstellungen → Bereiche**
3. Erstelle Areas und weise Geräte/Entitäten zu

### Statistiken zeigen keine Daten

**Problem**: Statistik-Karten bleiben leer

**Lösung**:
- **Energie**: Energie-Dashboard konfigurieren
- **Klima**: Temperatur/Feuchtigkeits-Sensoren Areas zuweisen
- **System**: System Monitor Integration aktivieren

### Strategy-Registrierungsfehler

**Problem**: `Timeout waiting for strategy element ll-strategy-dashboard-ll-strategy-l30neyn-dashboard`

**Lösung**:
1. Prüfe den `type` in der Dashboard-Konfiguration
2. Muss **exakt** sein: `custom:ll-strategy-l30neyn-dashboard`
3. **Nicht** `custom:ll-strategy-dashboard-l30neyn` oder andere Varianten
4. Cache-Refresh (Strg+Shift+R)

## 🔄 Updates

### Via HACS

1. HACS zeigt automatisch verfügbare Updates
2. Klicke auf **L30NEYN Dashboard Strategy**
3. Klicke **Aktualisieren**
4. Cache-Refresh im Browser (Strg+Shift+R)
5. Kein HA-Neustart nötig

### Manuelle Update-Prüfung

```bash
# In /config/www/community/l30neyn-dashboard-strategy/
cat version.json
```

Vergleiche mit [GitHub Releases](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases).

## 📚 Weiterführende Dokumentation

- [Installation Guide](../INSTALLATION.md) - Detaillierte Installation
- [Configuration Guide](../CONFIGURATION.md) - Erweiterte Konfiguration
- [Changelog](../CHANGELOG.md) - Versionsänderungen
- [README](../README.md) - Gesamtübersicht

## 🐛 Support

Bei Problemen:
1. Prüfe die [Troubleshooting-Sektion](#-troubleshooting)
2. Durchsuche [GitHub Issues](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues)
3. Erstelle ein neues Issue mit:
   - Home Assistant Version
   - Browser + Version
   - Console-Fehler (F12)
   - Screenshots

---

**Made with ❤️ by L30NEYN**
