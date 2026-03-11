# Update Guide

## Von Version 1.0.0 zu 1.1.0

### Änderungenübersicht

**Neue Features:**
- ✨ Einstellungs-Panel mit grafischer UI
- 🎨 Theme-System (Hell/Dunkel/Auto + Farbschemata)
- 📊 Statistik-Dashboard (Energie, Klima, System)
- ⚙️ Config-Manager mit Input-Helper-Integration

**Breaking Changes:**
- Config wird jetzt primär aus Input Helpers geladen (nicht mehr aus YAML)
- Neue Abhängigkeit: Input Helpers müssen erstellt werden

### Update-Schritte

#### 1. Backup erstellen

```bash
# Sichere aktuelle Installation
cp -r /config/www/ha-custom-dashboard-strategy /config/www/ha-custom-dashboard-strategy.backup
```

#### 2. Neue Dateien herunterladen

```bash
cd /config/www/ha-custom-dashboard-strategy/

# Hauptdatei aktualisieren
wget -O strategy.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/strategy.js

# Neue Utils
cd utils/
wget -O theme-manager.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/theme-manager.js
wget -O config-manager.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/config-manager.js
wget -O statistics-collectors.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/statistics-collectors.js
wget -O statistics-card-builders.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/utils/statistics-card-builders.js
cd ..

# Neue Views
cd views/
wget -O statistics-view.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/statistics-view.js
wget -O settings-view.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/settings-view.js
cd ..

# Bestehende Views aktualisieren (optional, aber empfohlen)
cd views/
wget -O overview-view.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/overview-view.js
wget -O room-view.js https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/views/room-view.js
cd ..
```

#### 3. Input Helpers erstellen

Das ist der wichtigste Schritt für Version 1.1.0!

**Via configuration.yaml:**

```bash
# Lade Template herunter
wget -O /config/input_helpers_dashboard.yaml https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/examples/input_helpers.yaml
```

Füge dann in `/config/configuration.yaml` hinzu:
```yaml
input_boolean: !include input_helpers_dashboard.yaml
```

Oder kopiere den Inhalt direkt in deine `configuration.yaml`.

**Prüfe Konfiguration:**
1. Entwicklerwerkzeuge → YAML → Konfiguration prüfen
2. Starte Home Assistant neu

#### 4. Ressource aktualisieren

**Option A: Bundle-Version (empfohlen)**

1. Lade neue Bundle-Datei:
   ```bash
   cd /config/www/ha-custom-dashboard-strategy/
   wget https://raw.githubusercontent.com/L30NEYN/ha-custom-dashboard-strategy/main/dist/ha-custom-dashboard-strategy-bundle.js
   ```

2. Aktualisiere Ressource:
   - Einstellungen → Dashboards → Ressourcen
   - Finde bestehende Ressource
   - Ändere URL zu: `/local/ha-custom-dashboard-strategy/ha-custom-dashboard-strategy-bundle.js`

**Option B: Einzelne Module (für Entwicklung)**

Keine Änderung nötig, stelle nur sicher dass alle neuen Module vorhanden sind.

#### 5. Dashboard aktualisieren

Keine Änderungen an der Dashboard-YAML nötig:

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
```

Das Dashboard wird automatisch die neuen Features erkennen!

#### 6. Browser-Cache leeren

**Wichtig:** Leere deinen Browser-Cache:
- Chrome/Edge: Strg+Shift+R
- Firefox: Strg+Shift+R
- Safari: Cmd+Option+R

Oder gehe in den Inkognito-/Privat-Modus zum Testen.

#### 7. Verifizierung

1. Öffne dein Dashboard
2. Du solltest jetzt sehen:
   - Neuer **Einstellungen**-Tab im Dashboard-Menü
   - Neuer **Statistiken**-Tab
   - Theme-Modus funktioniert (Hell/Dunkel/Auto)

3. Öffne Browser-Console (F12), erwartete Logs:
   ```
   [Strategy] Registered as ll-strategy-ha-custom-dashboard v1.1.0
   [Theme Manager] Module loaded
   [Config Manager] Module loaded
   [Statistics Collectors] Module loaded
   [Settings View] Module loaded
   [Statistics View] Module loaded
   ```

4. Teste Einstellungs-Panel:
   - Gehe zu Einstellungen-Tab
   - Ändere Theme-Modus (Hell/Dunkel)
   - Ändere Farbschema
   - Veränderungen sollten sofort sichtbar sein

### Migration von YAML-Config zu Input Helpers

Falls du in v1.0.0 YAML-Config verwendet hast:

**Alt (v1.0.0):**
```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  options:
    show_welcome: true
    show_areas: true
    # ...
```

**Neu (v1.1.0):**
1. Entferne `options` aus YAML (optional, wird überschrieben)
2. Konfiguriere über Input Helpers oder Einstellungs-Panel
3. YAML-Config wird weiterhin unterstützt als Override

**Empfehlung:** Nutze Input Helpers + Einstellungs-Panel für beste UX.

### Troubleshooting

#### Theme wird nicht angewendet

**Problem:** Farben bleiben unverändert

**Lösung:**
1. Prüfe ob `input_select.ha_custom_theme_mode` existiert
2. Prüfe Browser-Console:
   ```
   [Theme Manager] Applying theme: auto
   [Theme Manager] Detected scheme: dark
   ```
3. Wenn nicht vorhanden: Input Helpers fehlen, siehe Schritt 3
4. Browser-Cache leeren (Strg+Shift+R)

#### Einstellungen-View fehlt

**Problem:** Kein Einstellungen-Tab sichtbar

**Lösung:**
1. Prüfe ob `settings-view.js` existiert
2. Prüfe Browser-Console auf Fehler
3. Stelle sicher dass Input Helpers erstellt sind
4. Dashboard neu laden

#### Statistiken zeigen keine Daten

**Problem:** Statistik-Karten leer

**Lösung:**
1. Statistiken benötigen entsprechende Sensoren:
   - Energie: Energy Dashboard konfiguriert
   - Klima: Temperature/Humidity Sensoren in Räumen
   - System: System Monitor Integration
2. Aktiviere Debug-Modus im Einstellungs-Panel
3. Prüfe Console-Logs:
   ```javascript
   [Statistics Collectors] Collecting energy stats...
   [Statistics Collectors] Found N energy entities
   ```
4. Wenn keine Sensoren gefunden: Konfiguriere entsprechende Integrationen

#### Input Helpers nicht gefunden

**Problem:** `[Config Manager] Could not load config`

**Lösung:**
1. Prüfe Entwicklerwerkzeuge → Zustände:
   - Suche nach `input_boolean.ha_custom_show_welcome`
   - Wenn nicht vorhanden: Input Helpers nicht erstellt
2. Erstelle Input Helpers wie in Schritt 3 beschrieben
3. Starte Home Assistant neu
4. Dashboard neu laden

### Rollback zu v1.0.0

Falls du zurück zu v1.0.0 möchtest:

```bash
# Stelle Backup wieder her
rm -rf /config/www/ha-custom-dashboard-strategy/
cp -r /config/www/ha-custom-dashboard-strategy.backup /config/www/ha-custom-dashboard-strategy/

# Entferne Input Helpers (optional)
# Kommentiere in configuration.yaml aus oder lösche via UI
```

**Hinweis:** Input Helpers können behalten werden, sie stören v1.0.0 nicht.

### Neue Features nutzen

Nach erfolgreichem Update:

1. **Einstellungen erkunden**:
   - Gehe zu Einstellungen-Tab
   - Entdecke alle Optionen
   - Passe Dashboard an deine Bedürfnisse an

2. **Theme auswählen**:
   - Wähle Hell/Dunkel/Auto Modus
   - Teste verschiedene Farbschemata
   - Finde dein Lieblings-Theme

3. **Statistiken aktivieren**:
   - Toggle gewünschte Statistik-Karten
   - Konfiguriere fehlende Sensoren falls nötig
   - Genieße den Überblick

4. **Räume konfigurieren**:
   - Klicke auf Räume im Einstellungs-Panel
   - Aktiviere/Deaktiviere Domänen
   - Sortiere und verberge Entitäten

Viel Erfolg beim Update! 🚀
