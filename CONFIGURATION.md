# Konfiguration

Detaillierte Konfigurationsanleitung für die HA Custom Dashboard Strategy.

## Basis-Konfiguration

Die minimale Konfiguration benötigt nur die Strategy-Definition:

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
views: []
```

Dies generiert automatisch:
- Eine Übersichtsseite
- Raumseiten für alle konfigurierten Bereiche
- Automatische Gruppierung nach Domain (light, cover, sensor, etc.)

## Übersichtsseite

### Titel und Icon anpassen

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  title: "Mein Zuhause"  # Standard: "Übersicht"
  icon: "mdi:home-assistant"  # Standard: "mdi:home"
views: []
```

### Elemente ein-/ausblenden

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  show_welcome: true          # Begrüßungsnachricht
  show_areas: true            # Raum-Karten
  show_security: true         # Sicherheitsstatus
  show_light_summary: true    # Licht-Zusammenfassung
  show_battery_status: true   # Batterie-Status
views: []
```

### Wetter-Entität festlegen

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  weather_entity: weather.home  # Standard: Automatische Erkennung
views: []
```

## Raum-Konfiguration

### Entitäten ausblenden

Entitäten können pro Raum und Domain ausgeblendet werden:

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  areas_options:
    wohnzimmer:  # Area ID (nicht Name!)
      groups_options:
        light:
          hidden:
            - light.verstecktes_licht
            - light.anderes_licht
        cover:
          hidden:
            - cover.versteckter_rollo
views: []
```

**Wichtig**: Verwende die **Area ID**, nicht den Area-Namen!
- **Richtig**: `wohnzimmer` (kleingeschrieben, keine Leerzeichen)
- **Falsch**: `Wohnzimmer` oder `wohn_zimmer`

Area ID finden:
1. Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen**
2. Klicke auf den Bereich
3. Die URL zeigt die Area ID: `.../config/areas/area/AREA_ID`

### Sortierreihenfolge festlegen

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  areas_options:
    wohnzimmer:
      groups_options:
        light:
          order:
            - light.deckenlampe      # Wird zuerst angezeigt
            - light.stehlampe        # Wird als zweites angezeigt
            - light.leseleuchte      # Wird als drittes angezeigt
            # Alle anderen Lichter werden alphabetisch sortiert danach
views: []
```

### Mehrere Räume konfigurieren

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  areas_options:
    wohnzimmer:
      groups_options:
        light:
          hidden: [light.versteckt]
          order: [light.hauptlicht, light.ambientelicht]
        
    schlafzimmer:
      groups_options:
        light:
          order: [light.deckenlampe, light.nachttischlampe]
        cover:
          hidden: [cover.unsichtbarer_rollo]
    
    kueche:
      groups_options:
        light:
          order: [light.hauptbeleuchtung]
views: []
```

## Label-System

### Label `no_dboard` erstellen

1. Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen** → **Labels**
2. Klicke auf **Label hinzufügen**
3. Name: `no_dboard`
4. Icon: `mdi:eye-off` (optional)
5. Speichern

### Entitäten ausblenden

1. Gehe zu **Einstellungen** → **Geräte & Dienste** → **Entitäten**
2. Suche die Entität
3. Klicke auf die Entität
4. Klicke auf das Stift-Symbol
5. Füge das Label `no_dboard` hinzu
6. Speichern

### Räume ausblenden

1. Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen**
2. Klicke auf den Bereich
3. Füge das Label `no_dboard` hinzu
4. Speichern

## Domain-Gruppierung

### Unterstützte Domains

Die Strategy gruppiert automatisch nach folgenden Domains (in dieser Reihenfolge):

1. **light** - Beleuchtung
2. **cover** - Rollos & Vorhänge
3. **climate** - Klima (Heizung, Klimaanlage)
4. **fan** - Ventilatoren
5. **switch** - Schalter
6. **media_player** - Medien
7. **sensor** - Sensoren (gefiltert nach relevanten Device Classes)
8. **binary_sensor** - Status-Sensoren (gefiltert)
9. **camera** - Kameras

Weitere Domains werden automatisch am Ende hinzugefügt.

### Sensor-Filterung

Nur relevante Sensoren werden angezeigt:
- **temperature** - Temperatur
- **humidity** - Luftfeuchtigkeit
- **illuminance** - Helligkeit
- **motion** - Bewegung
- **occupancy** - Anwesenheit
- **door** - Tür
- **window** - Fenster

Diagnose- und Konfigurations-Sensoren werden automatisch ausgeblendet.

## Erweiterte Konfiguration

### Vollständiges Beispiel

```yaml
strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  
  # Übersichtsseite
  title: "Smart Home"
  icon: "mdi:home-automation"
  show_welcome: true
  show_areas: true
  show_security: true
  show_light_summary: true
  show_battery_status: true
  weather_entity: weather.forecast_home
  
  # Raum-Konfigurationen
  areas_options:
    # Wohnzimmer
    wohnzimmer:
      groups_options:
        light:
          hidden:
            - light.tv_hintergrundbeleuchtung
          order:
            - light.deckenlampe
            - light.stehlampe
            - light.leseleuchte
        cover:
          order:
            - cover.fenster_sued
            - cover.fenster_west
        sensor:
          hidden:
            - sensor.wohnzimmer_co2  # Wird separat angezeigt
    
    # Schlafzimmer
    schlafzimmer:
      groups_options:
        light:
          order:
            - light.deckenlampe
            - light.nachttischlampe_links
            - light.nachttischlampe_rechts
        cover:
          hidden: []  # Alle Rollos anzeigen
    
    # Küche
    kueche:
      groups_options:
        light:
          hidden:
            - light.dunstabzug_licht  # Teil des Geräts
          order:
            - light.deckenspots
            - light.unterschrankbeleuchtung
        switch:
          order:
            - switch.kaffeemaschine
            - switch.wasserkocher

views: []
```

## Best Practices

### 1. Label-basiertes Hiding bevorzugen

```yaml
# Nicht optimal:
areas_options:
  wohnzimmer:
    groups_options:
      light:
        hidden:
          - light.diagnose_sensor_1
          - light.diagnose_sensor_2
          - light.diagnose_sensor_3
```

Besser: Füge das Label `no_dboard` direkt zu den Entitäten hinzu.

### 2. Sinnvolle Sortierung

```yaml
# Hauptlichter zuerst, dann Akzentbeleuchtung
order:
  - light.deckenlampe
  - light.stehlampe
  - light.ambientelicht_1
  - light.ambientelicht_2
```

### 3. Bereiche-Organisation

Stelle sicher, dass:
- Alle Bereiche sinnvoll benannt sind
- Entitäten korrekt zugeordnet sind (via Entität oder Device)
- Unnötige Bereiche das Label `no_dboard` haben

### 4. Performance

Für optimale Performance:
- Blende Diagnose-Entitäten aus
- Verwende `hidden` für nicht benötigte Entitäten
- Deaktiviere unnötige Sensoren in der Integration

## Konfiguration speichern

Es gibt zwei Wege, die Konfiguration zu speichern:

### 1. Dashboard YAML (empfohlen)

- Gehe zu deinem Dashboard
- Klicke auf die drei Punkte → **Dashboard bearbeiten**
- Klicke erneut auf die drei Punkte → **Rohe Konfiguration bearbeiten**
- Bearbeite die YAML-Konfiguration
- Speichern

### 2. dashboards.yaml (fortgeschritten)

Für vollständige Versionskontrolle kannst du die Konfiguration in `/config/dashboards.yaml` speichern:

```yaml
# /config/dashboards.yaml
custom_dashboard:
  mode: yaml
  title: Smart Home
  icon: mdi:home
  show_in_sidebar: true
  require_admin: false
  strategy:
    type: custom:ll-strategy-ha-custom-dashboard
    # ... weitere Konfiguration
  views: []
```

Danach in `configuration.yaml` einbinden:

```yaml
# /config/configuration.yaml
lovelace:
  mode: storage
  dashboards:
    !include dashboards.yaml
```

## Troubleshooting

### Konfiguration wird nicht übernommen

1. Hard-Refresh: `Ctrl + F5` (Windows/Linux) oder `Cmd + Shift + R` (Mac)
2. Browser-Cache leeren
3. Home Assistant neu starten

### Area ID nicht gefunden

Überprüfe die Area ID:
1. Gehe zu **Einstellungen** → **Bereiche, Etagen & Zonen**
2. Klicke auf den Bereich
3. URL zeigt die ID: `.../config/areas/area/AREA_ID`

### Änderungen werden nicht angezeigt

1. Stelle sicher, dass du im Bearbeitungsmodus bist
2. Speichere die Konfiguration
3. Schließe den Bearbeitungsmodus
4. Hard-Refresh

## Nächste Schritte

- [Installation & Setup](INSTALLATION.md)
- Experimentiere mit verschiedenen Sortierungen
- Verwende Labels für saubere Organisation
- Erstelle GitHub Issues für Feature-Wünsche
