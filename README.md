# HA Custom Dashboard Strategy

Eine modulare, performante Dashboard-Strategy für Home Assistant. Generiert automatisch eine Übersichtsseite sowie einzelne Seiten für jeden Raum mit gruppierten Entitätssteuerungen.

## ✨ Features

- **Übersichtsseite** mit Wetter, Raumzusammenfassungen, Sicherheitsstatus und Batterieüberwachung
- **Automatische Raumseiten** für jeden konfigurierten Bereich in Home Assistant
- **Gruppierte Gerätesteuerung** nach Domain (Lichter, Rollos, Sensoren, etc.)
- **Vollmodularer Aufbau** - jedes Gerät und jeder Sensor kann einzeln konfiguriert werden
- **Intelligente Filterung** - versteckt Diagnose-, Konfigurations- und deaktivierte Entitäten automatisch
- **Label-basiertes Hiding** - verwende das Label `no_dboard` um Entitäten oder Räume auszublenden
- **Performance-optimiert** - nutzt Set-basierte Lookups und Early Returns
- **Gruppensteuerung** - steuere mehrere Lichter oder Rollos gleichzeitig
- **Einstellungspanel** (geplant) - grafische Konfiguration aller Optionen

## 📦 Installation

### Manuell

1. Kopiere den Inhalt des `dist/` Ordners nach `/config/www/ha-custom-dashboard/`
2. Füge die Ressource in Home Assistant hinzu:
   - Gehe zu **Einstellungen** → **Dashboards** → **Ressourcen**
   - Klicke auf **Ressource hinzufügen**
   - URL: `/local/ha-custom-dashboard/loader.js`
   - Ressourcentyp: **JavaScript-Modul**

### Via HACS (geplant)

Die Integration in HACS ist für eine spätere Version geplant.

## 🚀 Verwendung

### Dashboard erstellen

1. Gehe zu **Einstellungen** → **Dashboards**
2. Klicke auf **Dashboard hinzufügen**
3. Wähle:
   - **Titel**: z.B. "Mein Zuhause"
   - **Icon**: z.B. `mdi:home`
   - **URL**: z.B. `dashboard-custom`
   - **In Seitenleiste anzeigen**: Aktiviert
4. Öffne das neu erstellte Dashboard
5. Klicke auf die drei Punkte (oben rechts) → **Bearbeiten**
6. Wähle **Strategy** als Dashboard-Typ
7. Wähle **HA Custom Dashboard** aus der Liste
8. Speichern

### Basis-Konfiguration

```yaml
# In den Dashboard-Einstellungen (YAML-Editor)
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
views: []
```

### Erweiterte Konfiguration

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  
  # Übersichtsseite
  title: "Übersicht"
  icon: "mdi:home"
  show_welcome: true
  show_areas: true
  show_security: true
  show_light_summary: true
  show_battery_status: true
  
  # Wetter-Entität (optional, wird automatisch erkannt)
  weather_entity: weather.home
  
  # Raum-spezifische Optionen
  areas_options:
    wohnzimmer:  # Area ID
      groups_options:
        light:
          # Verstecke bestimmte Lichter
          hidden:
            - light.verstecktes_licht
          # Sortierreihenfolge
          order:
            - light.deckenlampe
            - light.stehlampe
            - light.leseleuchte
        cover:
          hidden: []
          order: []

views: []
```

## 🏷️ Label-System

### Entitäten ausblenden

1. Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entitäten**
2. Wähle die Entität aus
3. Füge das Label **`no_dboard`** hinzu
4. Die Entität wird nicht mehr im Dashboard angezeigt

### Räume ausblenden

1. Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen**
2. Wähle den Bereich aus
3. Füge das Label **`no_dboard`** hinzu
4. Der Raum wird nicht im Dashboard angezeigt

## 📝 Struktur

```
ha-custom-dashboard-strategy/
├── dist/
│   ├── loader.js              # Haupt-Loader
│   ├── strategy.js            # Strategy-Hauptklasse
│   ├── utils/
│   │   ├── helpers.js          # Helper-Funktionen
│   │   ├── data-collectors.js  # Daten-Sammler
│   │   └── card-builders.js    # Karten-Builder
│   └── views/
│       ├── overview-view.js    # Übersichtsseite
│       └── room-view.js        # Raumansichten
├── README.md
├── INSTALLATION.md
└── CONFIGURATION.md
```

## 🐛 Bekannte Einschränkungen

- Das Einstellungspanel ist noch nicht implementiert (Konfiguration momentan nur via YAML)
- HACS-Integration ist noch nicht verfügbar
- Raum-Icons werden noch nicht aus der Area-Konfiguration übernommen (geplant)

## 🛣️ Roadmap

- [ ] Einstellungspanel (GUI-Konfiguration)
- [ ] HACS-Integration
- [ ] Template-basierte Anpassungen
- [ ] Erweiterte Gruppierungsoptionen
- [ ] Custom Card Support
- [ ] Mehrsprachigkeit
- [ ] Themes/Styling-Optionen

## 📚 Weitere Dokumentation

- [Installation & Setup](INSTALLATION.md)
- [Konfiguration](CONFIGURATION.md)

## 👏 Credits

Inspiriert von [simon42-dashboard-strategy](https://github.com/TheRealSimon42/simon42-dashboard-strategy).

## 📝 Lizenz

MIT License - siehe LICENSE Datei für Details.

## ❤️ Support

Bei Problemen oder Fragen erstelle bitte ein Issue im GitHub Repository.
