# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [1.8.0] - 2026-03-14

### ✨ Neue Features

#### 🕐 Uhr + Favoriten-Block (Overview)
- **Uhrzeit-Chip** mit Live-Anzeige (HH:MM)
- **Datums-Chip** (TT.MM.JJJJ)
- **Favoriten-Entities** (max. 4) als Quick-Access Chips
- Konfigurierbar über `show_clock_favorites` und `favorite_entities`

**Beispiel-Konfiguration:**
```yaml
strategy:
  type: custom:l30neyn-dashboard-strategy
  show_clock_favorites: true
  favorite_entities:
    - light.wohnzimmer_haupt
    - climate.wohnzimmer
    - cover.wohnzimmer_rollo
    - sensor.temperatur_aussen
```


## [1.6.9] - 2026-03-13

### ✨ Added — Spalten- und Raumreihenfolge konfigurierbar

#### Spaltenreihenfolge (`column_order`)
- Neue globale Config-Option `column_order` — überschreibt die Standard-Reihenfolge der Domain-Spalten in Raumansichten
- Im Editor: Neuer Abschnitt **"Spaltenreihenfolge"** mit ↑↓-Buttons für jede verfügbare Spalte
- Spalten ohne Geräte werden weiterhin automatisch ausgeblendet
- Default-Reihenfolge bleibt unverändert wenn nicht konfiguriert

```yaml
strategy:
  type: custom:l30neyn-dashboard-strategy
  column_order:
    - light
    - cover
    - climate
    - switch
    - media_player
    - sensor
    - binary_sensor
    - camera
```

#### Raumreihenfolge (`area_order`)
- Neue globale Config-Option `area_order` — Liste von `area_id`s in gewünschter Reihenfolge
- Räume die nicht in der Liste sind, werden alphabetisch danach angehängt
- Im Editor: ↑↓-Buttons in jedem Raum-Header (neues Icon links vom Chevron)
- Änderungen werden sofort in der Config gespeichert

```yaml
strategy:
  type: custom:l30neyn-dashboard-strategy
  area_order:
    - wohnzimmer
    - kueche
    - schlafzimmer
    - bad
```

---

## [1.6.8] - 2026-03-13

### ✨ Added — Eigene Status-Spalte für binary_sensor

- `binary_sensor` hat jetzt eine eigene Spalte **"Status"** im Raum-View
- Bisher war `binary_sensor` mit `sensor` in der "Sensoren"-Spalte zusammengefasst
- `sensor`-Spalte zeigt weiterhin nur klassische Messwert-Sensoren

---

## [1.6.7] - 2026-03-13

### 🐛 Fixed — Volle Breite via panel: true

- **Fix:** `panel: true` auf dem Room-View-Objekt → volle View-Breite

---

## [1.3.0] - 2026-03-12

### 🔧 Fixed - CRITICAL RELEASE

- Strategy-Registrierung und Methodensignatur korrigiert

---

## Links

- **Repository**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy
- **Issues**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues
- **Releases**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases

[1.6.9]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.8...v1.6.9
[1.6.8]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.7...v1.6.8
[1.6.7]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.6...v1.6.7
[1.3.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.2.3...v1.3.0
