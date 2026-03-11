# HACS Submission Guide

## Checkliste für HACS-Integration

### ✅ Voraussetzungen erfüllt

- [x] **GitHub Repository**: Öffentlich und aktiv
- [x] **README.md**: Vollständige Dokumentation vorhanden
- [x] **LICENSE**: MIT License hinzugefügt
- [x] **Releases**: Bereit für v1.1.0 Release
- [x] **hacs.json**: Konfigurationsdatei erstellt
- [x] **info.md**: Kurzbeschreibung für HACS UI
- [x] **Validation Workflow**: GitHub Actions für HACS Validation

### 📋 Erforderliche Dateien

#### 1. `hacs.json`
```json
{
  "name": "L30NEYN Dashboard Strategy",
  "content_in_root": false,
  "filename": "l30neyn-dashboard-strategy.js",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

**Erklärung:**
- `name`: Anzeigename in HACS
- `content_in_root`: `false` weil Dateien in `dist/` liegen
- `filename`: Haupt-JavaScript-Datei die geladen werden soll
- `render_readme`: `true` zeigt README in HACS an
- `homeassistant`: Minimum Home Assistant Version

#### 2. `info.md`
Kurzbeschreibung die in HACS angezeigt wird (erstellt ✅)

#### 3. `.github/workflows/validate.yaml`
Automatische HACS-Validierung bei jedem Push (erstellt ✅)

#### 4. `LICENSE`
MIT License (erstellt ✅)

### 🚀 Schritt-für-Schritt: HACS Submission

#### Phase 1: Repository vorbereiten

**1. Build-Script ausführen**
```bash
cd /path/to/repo
python3 build.py
```

Das erstellt:
- `dist/l30neyn-dashboard-strategy.js` (gebundelte Version)
- Updated `examples/input_helpers.yaml` mit L30NEYN Prefix

**2. Alle Änderungen committen**
```bash
git add .
git commit -m "Prepare for HACS submission - v1.1.0"
git push origin main
```

**3. GitHub Release erstellen**

1. Gehe zu: https://github.com/L30NEYN/ha-custom-dashboard-strategy/releases/new
2. Tag: `v1.1.0`
3. Release Title: `L30NEYN Dashboard Strategy v1.1.0`
4. Description: Kopiere aus CHANGELOG.md (v1.1.0 Sektion)
5. Assets: Füge `dist/l30neyn-dashboard-strategy.js` hinzu
6. **Publish release**

#### Phase 2: HACS Default Repository beantragen

**Option A: Via GitHub (empfohlen)**

1. Gehe zu: https://github.com/hacs/default/issues/new/choose
2. Wähle: **Add repository to default**
3. Fülle Template aus:

```markdown
## Repository Information

**Repository URL**: https://github.com/L30NEYN/ha-custom-dashboard-strategy
**Category**: plugin
**Description**: A modular, performant Home Assistant dashboard strategy with automatic room recognition, theme system, and statistics.

## Checklist

- [x] The repository is public
- [x] The repository has a description
- [x] The repository has topics set
- [x] The code is in the default branch
- [x] The repository has releases
- [x] I have read the FAQ
- [x] I am the owner of this repository

## Additional Information

This is a dashboard strategy that provides:
- Automatic dashboard generation based on Home Assistant areas
- Theme system with 6 color schemes
- Statistics dashboard (Energy, Climate, System Health)
- Graphical settings panel
- Zero configuration needed (works out of the box)

The strategy integrates with Mushroom Cards for a modern UI.

Minimum HA version: 2024.1.0
Dependencies: Mushroom Cards (also in HACS)
```

4. Submit Issue
5. Warte auf Review (typischerweise 1-7 Tage)

**Option B: Via HACS Integration (Beta)**

Falls HACS Integration verfügbar:

1. Gehe zu HACS in Home Assistant
2. Menü → Custom repositories
3. Füge hinzu:
   - **Repository**: `https://github.com/L30NEYN/ha-custom-dashboard-strategy`
   - **Category**: Plugin
4. Nach Freigabe wird es in Default aufgenommen

#### Phase 3: Nach Approval

**Sobald approved:**

1. **Nutzer können installieren via**:
   - HACS → Frontend
   - Suche: "L30NEYN Dashboard Strategy"
   - Install

2. **Automatische Updates**:
   - Bei neuen Releases werden Nutzer benachrichtigt
   - Update über HACS UI möglich

### 📝 Submission Checklist

Vor dem Submission sicherstellen:

- [ ] **Repository sauber**:
  - [ ] Keine Debug-Logs im Code
  - [ ] Keine TODO-Kommentare in Production Code
  - [ ] Alle Dateien haben korrektes L30NEYN Branding
  
- [ ] **Dokumentation vollständig**:
  - [ ] README.md aktuell und vollständig
  - [ ] INSTALLATION.md mit Schritt-für-Schritt Guide
  - [ ] CHANGELOG.md mit allen Versionen
  - [ ] Examples/Screenshots vorhanden
  
- [ ] **Tests durchgeführt**:
  - [ ] Bundle-Datei lädt ohne Fehler
  - [ ] Dashboard generiert korrekt
  - [ ] Theme-Wechsel funktioniert
  - [ ] Settings-Panel funktional
  - [ ] Statistiken zeigen Daten an
  - [ ] Keine Console-Errors
  
- [ ] **HACS-Dateien**:
  - [ ] `hacs.json` erstellt
  - [ ] `info.md` erstellt
  - [ ] `.github/workflows/validate.yaml` erstellt
  - [ ] `LICENSE` vorhanden
  
- [ ] **Release vorbereitet**:
  - [ ] Git Tag `v1.1.0` erstellt
  - [ ] GitHub Release published
  - [ ] Release Notes aus CHANGELOG kopiert
  - [ ] Bundle als Asset hinzugefügt

### 🔧 Nach HACS Approval

**Best Practices für Maintenance:**

1. **Semantic Versioning** einhalten:
   - `MAJOR.MINOR.PATCH`
   - Breaking Changes: MAJOR bump
   - Neue Features: MINOR bump
   - Bug Fixes: PATCH bump

2. **Releases regelmäßig**:
   - Bei Bug Fixes: Zeitnah releasen
   - Bei Features: Sammeln und alle 2-4 Wochen
   - Breaking Changes: Gut dokumentieren + Migration Guide

3. **Issues zeitnah bearbeiten**:
   - Bug Reports: Innerhalb 48h antworten
   - Feature Requests: Labels setzen und in Roadmap aufnehmen
   - Duplicate/Invalid: Schnell schließen mit Verweis

4. **Community engagement**:
   - Discussions für Fragen nutzen
   - Wiki für erweiterte Guides
   - Contributors willkommen heißen

### 📊 Erfolgsmetriken

**Nach HACS Integration tracken:**

- **Stars/Forks**: Beliebtheits-Indikator
- **Issues**: Feedback und Bugs
- **Discussions**: Community-Aktivität
- **Downloads**: Via GitHub Insights

**Ziel für erstes Jahr:**
- 100+ Stars
- 10+ Contributors
- 1000+ Installationen
- 95%+ Issue-Response-Rate

### ❓ FAQ: HACS Submission

**Q: Wie lange dauert Approval?**
A: Typischerweise 1-7 Tage, manchmal bis zu 2 Wochen bei hohem Aufkommen.

**Q: Was wenn abgelehnt?**
A: Feedback umsetzen und erneut submitten. Häufige Gründe:
- Fehlende Dokumentation
- Keine Releases
- Code-Qualitätsprobleme
- Fehlende LICENSE

**Q: Kann ich vor Approval testen?**
A: Ja! Via Custom Repository in HACS:
1. HACS → Menü → Custom repositories
2. URL einfügen + Category "Plugin"
3. Installieren und testen

**Q: Muss ich für jedes Update neu submitten?**
A: Nein! Nach initialem Approval:
- Neue Releases automatisch in HACS
- Nutzer bekommen Update-Notification
- Kein Re-Submission nötig

**Q: Kann ich Repository-Name ändern?**
A: Ja, aber:
- GitHub Redirects funktionieren
- Besser: Früh entscheiden und dann beibehalten
- Bei Änderung: HACS Team informieren

### 🔗 Wichtige Links

- **HACS Documentation**: https://hacs.xyz
- **HACS Default Repo**: https://github.com/hacs/default
- **Validation Rules**: https://hacs.xyz/docs/publish/start
- **HACS Discord**: https://discord.gg/apgchf8

### 🎯 Nächste Schritte

1. [ ] Build-Script ausführen: `python3 build.py`
2. [ ] Changes committen und pushen
3. [ ] GitHub Release v1.1.0 erstellen
4. [ ] HACS Default Issue erstellen
5. [ ] Auf Approval warten
6. [ ] Nach Approval: Community announcement

---

**Status**: Bereit für Submission ✅
**Letzte Prüfung**: 2026-03-11
**Nächster Schritt**: GitHub Release erstellen
