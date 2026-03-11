# Installation Guide

## Voraussetzungen

- Home Assistant 2024.1 oder neuer
- Mushroom Cards (via HACS)
- Zugriff auf `/config` Verzeichnis

## Schritt-für-Schritt Anleitung

### 1. Mushroom Cards installieren

1. Öffne HACS in Home Assistant
2. Gehe zu **Frontend**
3. Suche nach **Mushroom Cards**
4. Klicke auf **Installieren**
5. Starte Home Assistant neu

### 2. Strategy-Dateien kopieren

#### Option A: Via SSH/Terminal

```bash
# Erstelle Verzeichnis
mkdir -p /config/www/ha-custom-dashboard-strategy/

# Lade Dateien
cd /config/www/ha-custom-dashboard-strategy/

# Hauptdateien
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/strategy.js

# Utils
mkdir -p utils
cd utils
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/entity-filter.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/card-builders.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/statistics-collectors.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/statistics-card-builders.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/theme-manager.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/config-manager.js
cd ..

# Views
mkdir -p views
cd views
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/overview-view.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/room-view.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/statistics-view.js
wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/settings-view.js
cd ..
```

#### Option B: Via File Editor Add-on

1. Installiere **File Editor** Add-on
2. Erstelle Verzeichnis: `/config/www/ha-custom-dashboard-strategy/`
3. Kopiere alle Dateien aus dem GitHub-Repository
4. Behalte die Ordnerstruktur bei:
   ```
   /config/www/ha-custom-dashboard-strategy/
   ├── strategy.js
   ├── utils/
   │   ├── entity-filter.js
   │   ├── card-builders.js
   │   ├── statistics-collectors.js
   │   ├── statistics-card-builders.js
   │   ├── theme-manager.js
   │   └── config-manager.js
   └── views/
       ├── overview-view.js
       ├── room-view.js
       ├── statistics-view.js
       └── settings-view.js
   ```

### 3. Ressource registrieren

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke auf die **drei Punkte** oben rechts
3. Wähle **Ressourcen**
4. Klicke **Ressource hinzufügen**
5. Füge hinzu:
   ```
   URL: /local/ha-custom-dashboard-strategy/ha-custom-dashboard-strategy-bundle.js
   Typ: JavaScript-Modul
   ```
6. Klicke **Erstellen**

### 4. Input Helpers erstellen

#### Option A: Via configuration.yaml (empfohlen)

1. Öffne `/config/configuration.yaml`
2. Füge den Inhalt von [`examples/input_helpers.yaml`](../examples/input_helpers.yaml) hinzu
3. Prüfe die Konfiguration: **Entwicklerwerkzeuge** → **YAML** → **Konfiguration prüfen**
4. Starte Home Assistant neu

#### Option B: Via UI (manuell)

Gehe zu **Einstellungen** → **Geräte & Dienste** → **Helfer** und erstelle:

**Input Booleans (Schalter):**
- `ha_custom_show_welcome` (Initial: An)
- `ha_custom_show_areas` (Initial: An)
- `ha_custom_show_security` (Initial: An)
- `ha_custom_show_light_summary` (Initial: An)
- `ha_custom_show_battery_status` (Initial: An)
- `ha_custom_show_energy_stats` (Initial: An)
- `ha_custom_show_climate_stats` (Initial: An)
- `ha_custom_show_system_health` (Initial: An)
- `ha_custom_show_network_stats` (Initial: Aus)
- `ha_custom_debug_mode` (Initial: Aus)

**Input Selects (Auswahl):**
- `ha_custom_theme_mode`
  - Optionen: `light`, `dark`, `auto`
  - Initial: `auto`
- `ha_custom_color_scheme`
  - Optionen: `default`, `blue`, `green`, `purple`, `orange`, `red`
  - Initial: `default`

**Input Text (Text):**
- `ha_custom_weather_entity`
  - Max Länge: 255
  - Initial: leer

### 5. Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke **Dashboard hinzufügen**
3. Wähle **Dashboard aus YAML**
4. Gib einen Titel ein: `Mein Custom Dashboard`
5. Füge folgende YAML ein:
   ```yaml
   strategy:
     type: custom:ll-strategy-ha-custom-dashboard
   ```
6. Klicke **Erstellen**
7. Das Dashboard wird automatisch generiert!

### 6. Verifizierung

1. Öffne das neue Dashboard
2. Du solltest sehen:
   - Übersichtsseite mit Willkommens-Karte
   - Automatisch generierte Raum-Views
   - Statistiken-View
   - Einstellungen-View
3. Öffne die Browser-Console (F12) und prüfe auf Fehler
4. Erwartete Logs:
   ```
   [Strategy] Registered as ll-strategy-ha-custom-dashboard v1.1.0
   [Theme Manager] Module loaded
   [Config Manager] Module loaded
   [Statistics Collectors] Module loaded
   ```

## Troubleshooting

### Dashboard lädt nicht

**Problem:** Weißer Bildschirm oder Fehlermeldung

**Lösung:**
1. Öffne Browser-Console (F12)
2. Suche nach JavaScript-Fehlern
3. Prüfe, ob Mushroom Cards installiert ist
4. Prüfe Dateipfade (Case-sensitive!)
5. Leere Browser-Cache: Strg+Shift+R

### Input Helpers nicht gefunden

**Problem:** `[Config Manager] Could not load config`

**Lösung:**
1. Prüfe ob alle Input Helpers existieren
2. Entity-IDs müssen exakt übereinstimmen:
   - `input_boolean.ha_custom_show_welcome`
   - `input_select.ha_custom_theme_mode`
   - etc.
3. Starte Home Assistant nach Erstellung neu

### Module nicht geladen

**Problem:** Einzelne Features fehlen (z.B. Statistiken)

**Lösung:**
1. Prüfe Browser-Console auf 404-Fehler
2. Verifiziere Ordnerstruktur in `/config/www/`
3. Prüfe Dateiberechtigungen (sollte lesbar sein)
4. Lade fehlende Dateien nach

### Mushroom Cards nicht gefunden

**Problem:** `Custom element doesn't exist: mushroom-entity-card`

**Lösung:**
1. Installiere Mushroom Cards über HACS
2. Starte Home Assistant neu
3. Leere Browser-Cache
4. Prüfe HACS → Frontend: Mushroom sollte installiert sein

### Theme wird nicht angewendet

**Problem:** Farben/Theme ändern sich nicht

**Lösung:**
1. Prüfe `input_select.ha_custom_theme_mode` Wert
2. Öffne Browser-Console, sollte zeigen:
   ```
   [Theme Manager] Applying theme: dark/light/auto
   ```
3. Prüfe ob CSS-Variablen gesetzt sind:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--ha-custom-primary')
   ```
4. Browser neu laden (Strg+Shift+R)

## Nächste Schritte

1. **Einstellungen erkunden**: Gehe zum Einstellungen-View und passe das Dashboard an
2. **Theme wählen**: Wähle dein bevorzugtes Farbschema
3. **Statistiken konfigurieren**: Aktiviere gewünschte Statistik-Karten
4. **Räume anpassen**: Konfiguriere einzelne Raum-Ansichten
5. **Labels nutzen**: Füge `no_dboard` Label hinzu um Entitäten auszublenden

Viel Spaß mit deinem Custom Dashboard! 🎉
