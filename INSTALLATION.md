# Installation & Setup

Detaillierte Installationsanleitung für die HA Custom Dashboard Strategy.

## Voraussetzungen

- Home Assistant 2024.1.0 oder neuer
- Zugriff auf das Home Assistant Dateisystem (via File Editor, Samba, SSH, etc.)
- Bereiche (Areas) in Home Assistant konfiguriert
- Entitäten den entsprechenden Bereichen zugeordnet

## Schritt 1: Dateien kopieren

### Via File Editor (empfohlen)

1. Installiere den **File Editor** Add-on falls noch nicht vorhanden:
   - Gehe zu **Einstellungen** → **Add-ons** → **Add-on Store**
   - Suche nach "File Editor"
   - Installiere und starte den Add-on

2. Öffne den File Editor

3. Erstelle das Verzeichnis `/config/www/ha-custom-dashboard/`

4. Kopiere alle Dateien aus dem `dist/` Ordner des Repositories:
   ```
   /config/www/ha-custom-dashboard/
   ├── loader.js
   ├── strategy.js
   ├── utils/
   │   ├── helpers.js
   │   ├── data-collectors.js
   │   └── card-builders.js
   └── views/
       ├── overview-view.js
       └── room-view.js
   ```

### Via Samba

1. Verbinde dich mit deinem Home Assistant Samba-Share
2. Navigiere zu `/config/www/`
3. Erstelle den Ordner `ha-custom-dashboard`
4. Kopiere alle Dateien aus `dist/` hinein

### Via SSH

```bash
# Mit SSH verbinden
ssh root@homeassistant.local

# Verzeichnis erstellen
mkdir -p /config/www/ha-custom-dashboard/

# Dateien kopieren (von lokalem Rechner)
scp -r dist/* root@homeassistant.local:/config/www/ha-custom-dashboard/
```

## Schritt 2: Ressource registrieren

1. Öffne Home Assistant im Browser

2. Gehe zu **Einstellungen** → **Dashboards**

3. Klicke auf die drei Punkte (oben rechts) → **Ressourcen**

4. Klicke auf **Ressource hinzufügen**

5. Fülle das Formular aus:
   - **URL**: `/local/ha-custom-dashboard/loader.js`
   - **Ressourcentyp**: **JavaScript-Modul**

6. Klicke auf **Erstellen**

7. **Hard-Refresh** deines Browsers:
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

## Schritt 3: Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**

2. Klicke auf **Dashboard hinzufügen** (unten rechts)

3. Wähle **Standard-Dashboard**

4. Fülle das Formular aus:
   - **Titel**: z.B. "Mein Zuhause"
   - **Icon**: z.B. `mdi:home-assistant`
   - **URL**: z.B. `custom-dashboard`
   - **In Seitenleiste anzeigen**: Aktiviert
   - **Nur für Administratoren**: Nach Bedarf

5. Klicke auf **Erstellen**

## Schritt 4: Strategy aktivieren

1. Klicke in der Seitenleiste auf dein neu erstelltes Dashboard

2. Klicke auf die drei Punkte (oben rechts) → **Dashboard bearbeiten**

3. Klicke erneut auf die drei Punkte → **Rohe Konfiguration bearbeiten**

4. Ersetze den Inhalt mit:
   ```yaml
   strategy:
     type: custom:ll-strategy-ha-custom-dashboard
   views: []
   ```

5. Klicke auf **Speichern**

6. Schließe den Bearbeitungsmodus

## Schritt 5: Testen

1. Das Dashboard sollte jetzt automatisch generiert werden

2. Du solltest sehen:
   - Eine **Übersichtsseite** mit Wetterkarte und Raumübersicht
   - **Raumseiten** für jeden konfigurierten Bereich

3. Überprüfe die Browser-Konsole auf Fehler:
   - Drücke `F12`
   - Wechsle zum Tab "Konsole"
   - Es sollten mehrere `[Strategy]` Log-Meldungen erscheinen

## Fehlersuche

### Dashboard wird nicht generiert

1. **Überprüfe die Browser-Konsole** (`F12` → Konsole):
   - Sind Fehler sichtbar?
   - Werden die Module geladen?

2. **Ressource korrekt registriert?**
   - Gehe zu **Einstellungen** → **Dashboards** → **Ressourcen**
   - Ist `/local/ha-custom-dashboard/loader.js` aufgelistet?
   - Typ: "JavaScript-Modul"?

3. **Dateien korrekt kopiert?**
   - Gehe zu: `http://your-ha-ip:8123/local/ha-custom-dashboard/loader.js`
   - Wird die Datei angezeigt?

4. **Cache-Problem?**
   - Hard-Refresh: `Ctrl + F5` (Windows/Linux) oder `Cmd + Shift + R` (Mac)
   - Oder: Browser-Cache komplett leeren

### Keine Raumseiten

1. **Bereiche konfiguriert?**
   - Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen**
   - Sind Bereiche angelegt?

2. **Entitäten zugeordnet?**
   - Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entitäten**
   - Wähle eine Entität aus
   - Ist ein Bereich zugeordnet?

3. **Label `no_dboard` gesetzt?**
   - Überprüfe ob der Bereich das Label `no_dboard` hat
   - Falls ja, entferne es

### Entitäten werden nicht angezeigt

1. **Entität deaktiviert?**
   - Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entitäten**
   - Ist die Entität aktiviert?

2. **Label `no_dboard` gesetzt?**
   - Überprüfe die Entität
   - Entferne das Label falls vorhanden

3. **Entität als "Diagnose" markiert?**
   - Strategy blendet Diagnose-Entitäten automatisch aus

### Performance-Probleme

1. **Zu viele Entitäten?**
   - Verwende das Label `no_dboard` um unnötige Entitäten auszublenden
   - Deaktiviere nicht benötigte Sensoren

2. **Browser-Performance**
   - Schließe andere Tabs
   - Verwende einen modernen Browser (Chrome, Firefox, Safari)

## Nächste Schritte

- [Konfiguration anpassen](CONFIGURATION.md)
- Labels zum Ausblenden von Entitäten verwenden
- Raumansichten individualisieren

## Support

Bei weiteren Problemen erstelle bitte ein Issue im GitHub Repository mit:
- Home Assistant Version
- Browser und Version
- Fehlermeldungen aus der Konsole
- Relevante Konfiguration (ohne sensible Daten)
