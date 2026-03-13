# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [1.6.8] - 2026-03-13

### ✨ Added — Eigene Status-Spalte für binary_sensor

- `binary_sensor` hat jetzt eine eigene Spalte **"Status"** im Raum-View
- Bisher war `binary_sensor` mit `sensor` in der "Sensoren"-Spalte zusammengefasst — im Editor aber als eigene Gruppe "Status" geführt → Inkonsistenz behoben
- Alle `binary_sensor` mit relevanten `device_class`-Werten werden angezeigt: `motion`, `occupancy`, `door`, `window`, `smoke`, `moisture`, `vibration`, `gas`, `battery`, `connectivity`, `plug`, `presence`
- `sensor`-Spalte zeigt weiterhin nur klassische Messwert-Sensoren: `temperature`, `humidity`, `illuminance`, `battery`

### 🏗️ Neue Spaltenreihenfolge

| Spalte | Domains |
|---|---|
| 💡 Beleuchtung | `light` |
| 🪟 Rollos | `cover` |
| 🌡️ Klima | `climate`, `fan` |
| 🎵 Medien | `media_player` |
| 🔘 Schalter | `switch` |
| 👁️ Sensoren | `sensor` |
| 🔔 Status | `binary_sensor` |
| 📷 Kameras | `camera` |

---

## [1.6.7] - 2026-03-13

### 🐛 Fixed — Volle Breite via panel: true

- **Problem:** `card_mod` auf `vertical-stack` hatte keinen Effekt, da `hui-vertical-stack-card` intern keine `ha-card`-Instanz rendert
- **Fix:** `panel: true` auf dem Room-View-Objekt → HA rendert die einzige Card ohne Grid-Limitierung in voller View-Breite
- `card_mod` vom `vertical-stack` entfernt (war wirkungslos)

---

## [1.6.6] - 2026-03-13

### 🐛 Fixed — Layout-Fix: Spaltenbreite im Raum-View

- **Problem:** `vertical-stack` nutzte HA's Default-`max-width` (~600px)
- **Fix:** `card_mod` auf dem äußeren `vertical-stack` → `max-width: 100% !important` (wurde in v1.6.7 durch bessere Lösung ersetzt)

---

## [1.6.5] - 2026-03-13

### 🐛 Fixed — Header über allen Spalten

- **Problem:** Titel + Chips standen links neben Schalter & Sensoren, weil HA's View-Grid alle Cards gleichwertig verteilte
- **Fix:** Alles in einen einzigen `vertical-stack` gewrappt — HA's Grid sieht nur noch 1 Card

---

## [1.6.4] - 2026-03-13

### ✨ Added — Dedizierter Chip-Header

- `mushroom-template-card`-Header ersetzt durch zweiteilige Lösung:
  - `mushroom-title-card` → Raumname schlicht
  - `mushroom-chips-card` → Badges mit Live-Templates (Temp, Feuchte, Lux, CO₂, Lichter X/Y, Rollos X/Y, Klima-Soll)

---

## [1.6.3] - 2026-03-13

### ✨ Added — Spalten-Layout & dynamischer Header

- Jede Domain-Kategorie bekommt eine eigene `vertical-stack`-Spalte
- Spalten nur sichtbar wenn Geräte vorhanden

---

## [1.3.0] - 2026-03-12

### 🔧 Fixed - CRITICAL RELEASE

- Strategy-Registrierung und Methodensignatur korrigiert
- Registry-Datenzugriff auf `hass.areas/devices/entities` umgestellt

---

## Links

- **Repository**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy
- **Issues**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues
- **Releases**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases

## Contributors

- **Leon Heyn** ([@L30NEYN](https://github.com/L30NEYN)) - Author und Maintainer

---

[1.6.8]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.7...v1.6.8
[1.6.7]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.6...v1.6.7
[1.6.6]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.5...v1.6.6
[1.6.5]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.4...v1.6.5
[1.6.4]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.3.0...v1.6.3
[1.3.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.2.3...v1.3.0
