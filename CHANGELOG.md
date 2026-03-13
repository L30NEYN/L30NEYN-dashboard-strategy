# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

## [1.6.6] - 2026-03-13

### 🐛 Fixed — Layout-Fix: Spaltenbreite im Raum-View

- **Problem:** `vertical-stack` nutzte HA's Default-`max-width` (~600px), wodurch der innere `horizontal-stack` nur diesen schmalen Bereich auf 5+ Spalten aufteilen musste → Cards viel zu eng
- **Fix:** `card_mod` auf dem äußeren `vertical-stack` (dem einzigen `roomCard`-Element der View) → `max-width: 100% !important; width: 100% !important;`
- **Ergebnis:** Der `horizontal-stack` bekommt die volle View-Breite und verteilt die Domain-Spalten korrekt

---

## [1.6.5] - 2026-03-13

### 🐛 Fixed — Header über allen Spalten

- **Problem:** Titel + Chips standen links neben Schalter & Sensoren, weil HA's View-Grid alle Cards gleichwertig verteilte
- **Fix:** Alles in einen einzigen `vertical-stack` gewrappt — HA's Grid sieht nur noch 1 Card

```
vertical-stack (einzige Card der View)
├── mushroom-title-card
├── mushroom-chips-card
└── horizontal-stack → alle Spalten nebeneinander
```

---

## [1.6.4] - 2026-03-13

### ✨ Added — Dedizierter Chip-Header

- `mushroom-template-card`-Header ersetzt durch zweiteilige Lösung:
  - `mushroom-title-card` → Raumname schlicht
  - `mushroom-chips-card` → Badges mit Live-Templates (Temp, Feuchte, Lux, CO₂, Lichter X/Y, Rollos X/Y, Klima-Soll)
- Chips transparent via `card_mod` (`background: none`)
- Chips nur gerendert wenn relevante Entities vorhanden

---

## [1.6.3] - 2026-03-13

### ✨ Added — Spalten-Layout & dynamischer Header

- Jede Domain-Kategorie (Licht, Rollos, Klima, Schalter, Sensoren…) bekommt eine eigene `vertical-stack`-Spalte
- Spalten nur sichtbar wenn Geräte vorhanden
- Header als `mushroom-template-card` mit Live-Templates (Temp, Feuchte, Lichter, Rollos)
- Bis zu 3 Spalten nebeneinander via `horizontal-stack`

---

## [1.3.0] - 2026-03-12

### 🔧 Fixed - CRITICAL RELEASE

**DIESER RELEASE BEHEBT KRITISCHE FEHLER DIE DAS DASHBOARD KOMPLETT UNBRAUCHBAR MACHTEN!**

- **✅ HAUPTPROBLEM BEHOBEN**: Strategy wurde nicht korrekt registriert
  - **Fehler**: `No strategy type found` 
  - **Fehler**: `Timeout waiting for strategy element ll-strategy-dashboard-l30neyn`
  - **Root Cause**: Falsche Methodensignatur in der Strategy-Klasse
  - **Lösung**: Signatur von `generate(info)` zu `generate(config, hass)` geändert (wie Home Assistant API erwartet)

- **✅ Registry-Daten-Zugriff korrigiert**:
  - **Vorher**: WebSocket-Calls zu `config/entity_registry/list` etc.
  - **Nachher**: Direkter Zugriff auf `hass.areas`, `hass.devices`, `hass.entities` (wie Simon42)
  - **Vorteil**: Schneller, zuverlässiger, keine Race Conditions mehr

- **✅ Element-Registrierung korrigiert**:
  - Element Name: `ll-strategy-dashboard-l30neyn`
  - YAML Type: `custom:l30neyn`
  - Home Assistant fügt automatisch `ll-strategy-dashboard-` Prefix hinzu

### ✨ Changed

- **Single-File-Architektur**: Alle Module in eine Datei konsolidiert

### 📦 Installation

**HACS (empfohlen)**:
1. HACS öffnen → Integrations → Custom repositories
2. Repository URL hinzufügen: `https://github.com/L30NEYN/L30NEYN-dashboard-strategy`
3. Kategorie: `Dashboard` auswählen
4. "L30NEYN Dashboard Strategy" installieren
5. Home Assistant neu starten

---

## [1.2.3] - 2026-03-11

### ⚠️ DEPRECATED - Diese Version hatte kritische Bugs!

**NICHT VERWENDEN** - Upgrade auf v1.3.0!

---

## Links

- **Repository**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy
- **Issues**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues
- **Releases**: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases

## Contributors

- **Leon Heyn** ([@L30NEYN](https://github.com/L30NEYN)) - Author und Maintainer

---

[1.6.6]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.5...v1.6.6
[1.6.5]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.4...v1.6.5
[1.6.4]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.6.3...v1.6.4
[1.6.3]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.3.0...v1.6.3
[1.3.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.1.0...v1.2.3
[1.1.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/L30NEYN/L30NEYN-dashboard-strategy/releases/tag/v1.0.0
