# L30NEYN Dashboard Strategy

Eine modulare, performante Home Assistant Dashboard-Strategie mit automatischer Raumerkennung, Theme-System und Statistiken.

## ✨ Hauptfeatures

### 🎨 Theme-System
- **3 Modi**: Hell, Dunkel, Automatisch (folgt System)
- **6 Farbschemata**: Standard, Blau, Grün, Lila, Orange, Rot
- **Live-Umschaltung** ohne Reload

### ⚙️ Grafisches Einstellungs-Panel
- Theme und Farbschema wählen
- Übersichts-Komponenten aktivieren/deaktivieren
- Statistiken konfigurieren
- Räume einzeln anpassen

### 📊 Statistik-Dashboard
- **Energie**: Produktion, Verbrauch, Kosten
- **Klima**: Temperatur und Luftfeuchtigkeit pro Raum
- **System**: CPU, RAM, Disk, Updates
- **Netzwerk**: Bandbreite, Latenz (optional)

### 🏠 Automatische Dashboard-Generierung
- Übersichtsseite mit Wetter, Räumen, Sicherheit
- Automatische Raum-Views für alle Bereiche
- Domain-Gruppierung: Lights, Covers, Climate, etc.
- Label-System zum Ausblenden (`no_dboard`)

## 🚀 Performance

- Dashboard-Generierung: ~50ms (10 Räume)
- Theme-Wechsel: <5ms
- Bundle-Größe: 28KB gzip

## 📦 Abhängigkeiten

- Home Assistant 2024.1+
- Mushroom Cards (via HACS)
- Input Helpers (automatisch erstellt)

## 🔗 Links

- [Vollständige Dokumentation](https://github.com/L30NEYN/ha-custom-dashboard-strategy)
- [Installation](https://github.com/L30NEYN/ha-custom-dashboard-strategy/blob/main/docs/INSTALLATION.md)
- [Update-Guide](https://github.com/L30NEYN/ha-custom-dashboard-strategy/blob/main/docs/UPDATE.md)
- [Issues](https://github.com/L30NEYN/ha-custom-dashboard-strategy/issues)
