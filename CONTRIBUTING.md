# Beitragen zur HA Custom Dashboard Strategy

Vielen Dank für dein Interesse, zu diesem Projekt beizutragen! 🎉

## 🐛 Issues melden

### Bug Reports

Wenn du einen Bug gefunden hast, erstelle bitte ein Issue mit:

- **Titel**: Kurze, prägnante Beschreibung
- **Beschreibung**: Was ist passiert? Was hast du erwartet?
- **Schritte zur Reproduktion**: Wie kann der Bug nachgestellt werden?
- **Umgebung**:
  - Home Assistant Version
  - Browser und Version
  - Dashboard Strategy Version
- **Logs**: Relevante Fehlermeldungen aus der Browser-Konsole
- **Konfiguration**: Relevante Teile deiner Konfiguration (ohne sensible Daten)

### Feature Requests

Für neue Features:

- **Titel**: Klare Feature-Beschreibung
- **Motivation**: Warum wäre dieses Feature nützlich?
- **Beschreibung**: Wie sollte es funktionieren?
- **Beispiele**: Mockups, Beispiele aus anderen Projekten

## 🛠️ Pull Requests

### Vorbereitung

1. **Fork** das Repository
2. **Clone** deinen Fork:
   ```bash
   git clone https://github.com/DEIN-USERNAME/ha-custom-dashboard-strategy.git
   cd ha-custom-dashboard-strategy
   ```
3. **Branch erstellen**:
   ```bash
   git checkout -b feature/mein-feature
   # oder
   git checkout -b fix/mein-bugfix
   ```

### Entwicklung

1. **Dateien bearbeiten** in `dist/`
2. **Testen** in deiner Home Assistant Instanz:
   - Kopiere Dateien nach `/config/www/ha-custom-dashboard/`
   - Hard-Refresh im Browser (`Ctrl + F5`)
3. **Code-Stil beachten**:
   - JSDoc-Kommentare für Funktionen
   - Sprechende Variablennamen
   - Konsistente Formatierung
4. **Logs hinzufügen**:
   ```javascript
   console.info('[ModuleName] Info message');
   console.warn('[ModuleName] Warning message');
   console.error('[ModuleName] Error message', error);
   ```

### Code-Richtlinien

#### JavaScript

- **ES6+** Syntax verwenden
- **Arrow Functions** für Callbacks
- **Const/Let** statt var
- **Template Literals** für Strings
- **Destructuring** wo sinnvoll

```javascript
// ✅ Gut
const filterEntities = (entities, domain) => {
  return entities.filter(e => e.entity_id.startsWith(`${domain}.`));
};

// ❌ Schlecht
var filterEntities = function(entities, domain) {
  var result = [];
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].entity_id.indexOf(domain + '.') === 0) {
      result.push(entities[i]);
    }
  }
  return result;
};
```

#### Performance

- **Set/Map** für Lookups verwenden
- **Early Returns** nutzen
- **Unnötige Schleifen** vermeiden

```javascript
// ✅ Performant
const domainSet = new Set(['light', 'cover', 'switch']);
return entities.filter(e => {
  const domain = e.entity_id.split('.')[0];
  return domainSet.has(domain);
});

// ❌ Langsam
return entities.filter(e => {
  return ['light', 'cover', 'switch'].includes(e.entity_id.split('.')[0]);
});
```

#### JSDoc

```javascript
/**
 * Filtert Entitäten nach Domain
 * @param {Array} entities - Array von Entitätsobjekten
 * @param {string} domain - Domain-Name (z.B. 'light')
 * @returns {Array} Gefilterte Entitäten
 */
filterByDomain(entities, domain) {
  // ...
}
```

### Commit Messages

Verwende aussagekräftige Commit-Messages:

```bash
# Features
git commit -m "Add group control for covers"
git commit -m "Add battery status monitoring"

# Bugfixes
git commit -m "Fix entity filtering for disabled entities"
git commit -m "Fix area ID resolution"

# Dokumentation
git commit -m "Update installation guide"
git commit -m "Add configuration examples"

# Performance
git commit -m "Optimize entity filtering with Set lookups"
```

### Pull Request erstellen

1. **Push** zu deinem Fork:
   ```bash
   git push origin feature/mein-feature
   ```
2. Erstelle einen **Pull Request** auf GitHub
3. **Titel**: Klare Beschreibung der Änderung
4. **Beschreibung**:
   - Was wurde geändert?
   - Warum?
   - Wie wurde es getestet?
   - Wurden Issues gelöst? (#123)

## 📝 Dokumentation

### Dateien aktualisieren

- **README.md**: Features, Quick Start
- **INSTALLATION.md**: Detaillierte Installation
- **CONFIGURATION.md**: Alle Konfigurationsoptionen
- **CHANGELOG.md**: Änderungen dokumentieren

### Beispiele hinzufügen

Füge praktische Beispiele in `examples/` hinzu:

```yaml
# examples/mein-usecase.yaml
# Beschreibung des Use Cases

strategy:
  type: custom:ll-strategy-ha-custom-dashboard
  # Beispiel-Konfiguration
```

## 🧪 Testing

### Manuelles Testen

1. **Installation** in Test-Instanz
2. **Verschiedene Szenarien** testen:
   - Leere Räume
   - Räume mit vielen Entitäten
   - Verschiedene Domains
   - Label-Filtering
   - Custom-Konfigurationen
3. **Browser-Konsole** auf Fehler prüfen
4. **Performance** messen:
   ```javascript
   const startTime = performance.now();
   // ... Code ...
   const endTime = performance.now();
   console.log(`Took ${endTime - startTime}ms`);
   ```

### Checkliste

- [ ] Code funktioniert in Home Assistant
- [ ] Keine Fehler in Browser-Konsole
- [ ] Performance ist akzeptabel (<100ms für Dashboard-Generierung)
- [ ] Dokumentation aktualisiert
- [ ] CHANGELOG aktualisiert
- [ ] Commit-Messages sind aussagekräftig
- [ ] Code folgt Projekt-Richtlinien

## 💬 Fragen?

Bei Fragen kannst du:

- Ein **Issue** erstellen
- Mich direkt kontaktieren (siehe GitHub Profil)

## 🚀 Ideen für Beiträge

### Einfach (Good First Issue)

- Dokumentation verbessern
- Beispiele hinzufügen
- Übersetzungen (Englisch)
- Bug-Fixes
- Code-Kommentare verbessern

### Mittel

- Neue Card-Builder
- Zusätzliche Sensor-Filterung
- Domain-Titel anpassen
- Verbesserte Sortierung

### Fortgeschritten

- Einstellungspanel (GUI-Konfiguration)
- Template-System
- Custom Card Integration
- Theme-System
- Statistik-Aggregation

## ❤️ Danke!

Jeder Beitrag hilft, dieses Projekt besser zu machen. Danke, dass du dabei bist! 🎉
