# HA Custom Dashboard Strategy

Eine vollmodulare, hochperformante Dashboard-Strategy für Home Assistant mit grafischem Konfigurator.

## Features

✅ **Übersichtsseite** - Zusammenfassungen aller Räume, Wetter & Systeminfos
✅ **Raumansichten** - Individuelle Seiten für jeden Raum mit allen Geräten
✅ **Gruppierung** - Intelligente Gruppierung nach Domain & Status
✅ **Gruppierte Steuerung** - Batch-Aktionen für alle Geräte eines Raums
✅ **Vollmodular** - Jedes Gerät und jeder Sensor kann ausgewählt werden
✅ **Grafischer Editor** - Einstellungspanel für einfache Konfiguration
✅ **Performance** - Optimierte Ladezeiten durch Registry-Caching

## Installation

1. Installiere über HACS oder kopiere die `dist/` Dateien nach `/config/www/ha-custom-dashboard-strategy/`
2. Füge die Resource hinzu:
   ```yaml
   lovelace:
     resources:
       - url: /local/ha-custom-dashboard-strategy/ha-custom-dashboard-strategy.js
         type: module
   ```
3. Erstelle ein neues Dashboard mit:
   ```yaml
   strategy:
     type: custom:ha-custom-dashboard
   ```

## Konfiguration

Verwende den grafischen Editor im Dashboard oder konfiguriere direkt:

```yaml
strategy:
  type: custom:ha-custom-dashboard
  show_weather: true
  show_energy: true
  summaries_columns: 2
  areas_display:
    hidden: []
    order: []
  areas_options: {}
```

Mehr Infos in der README!
