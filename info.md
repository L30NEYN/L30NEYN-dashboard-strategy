# L30NEYN Dashboard Strategy

Eine modulare, performante Home Assistant Dashboard-Strategie von **L30NEYN** mit automatischer Raumerkennung, Theme-System und Statistiken.

## ✨ Highlights

- 🏠 **Automatische Raum-Views** basierend auf Area Registry
- 🎨 **Theme-System** mit 3 Modi (Hell/Dunkel/Auto) + 6 Farbschemata
- 📊 **Statistik-Dashboard** (Energie, Klima, System, Netzwerk)
- ⚙️ **Einstellungs-Panel** zur grafischen Konfiguration
- 🎴 **Mushroom-Cards** Integration
- 🏷️ **Label-basiertes** Entity-Hiding

## 📦 Installation

Diese Komponente wurde über HACS installiert.

### Nächste Schritte:

1. **Input Helpers erstellen** (erforderlich)
   - Siehe [Installation Guide](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/INSTALLATION.md)
   - YAML-Template: [input_helpers.yaml](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/examples/input_helpers.yaml)

2. **Mushroom Cards installieren** (erforderlich)
   - HACS → Frontend → Mushroom Cards

3. **Dashboard erstellen**
   - Einstellungen → Dashboards → Dashboard hinzufügen
   - Strategy: `custom:ll-strategy-l30neyn-dashboard`

### Dashboard-Konfiguration:

```yaml
title: L30NEYN Dashboard
strategy:
  type: custom:ll-strategy-l30neyn-dashboard
```

**Wichtig:** Der `type` muss **exakt** `custom:ll-strategy-l30neyn-dashboard` sein!

## 🎨 Konfiguration

Navigiere zum **Einstellungen**-Tab im Dashboard für:
- Theme-Modus & Farbschema wählen
- Übersichts-Karten aktivieren/deaktivieren
- Statistiken konfigurieren
- Raum-Views anpassen
- Debug-Modus aktivieren

## 📚 Dokumentation

- [Vollständige README](https://github.com/L30NEYN/L30NEYN-dashboard-strategy)
- [Installations-Guide](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/INSTALLATION.md)
- [HACS-Setup](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/docs/HACS_SETUP.md)
- [Konfigurations-Guide](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/CONFIGURATION.md)
- [Changelog](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/blob/main/CHANGELOG.md)

## 🐛 Issues & Support

- [GitHub Issues](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/issues)
- [Discussions](https://github.com/L30NEYN/L30NEYN-dashboard-strategy/discussions)

## ⭐ Support the Project

Wenn dir dieses Projekt gefällt:
- ⭐ Star das Repository
- 🐛 Melde Bugs
- 💡 Schlage Features vor
- 🤝 Contribute via Pull Requests

---

**Made with ❤️ by L30NEYN**
