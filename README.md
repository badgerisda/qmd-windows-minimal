# QMD 2.5.3 unter Windows 11

Dieses vollständig eigenständige Minimalbeispiel installiert das veröffentlichte npm-Paket `@tobilu/qmd` in Version `2.5.3` projektlokal und verwendet seine Node-SDK direkt. WSL, eine Weboberfläche, LM Studio und eine RAG-Antwortgenerierung sind nicht erforderlich.

## Voraussetzungen

- Windows 11
- Node.js 22 oder neuer
- npm

## Installation

1. ZIP-Datei entpacken.
2. PowerShell im entpackten Ordner öffnen.
3. Abhängigkeiten installieren:

```powershell
npm install
```

QMD wird nicht aus seinem Git-Repository installiert. Das veröffentlichte npm-Paket ist als lokale Projektabhängigkeit mit der exakten Version `2.5.3` eingetragen.

## Index aufbauen

```powershell
npm run index
```

Das Skript indexiert die zwei erfundenen Markdown-Dateien und erzeugt nur fehlende Embeddings. Beim ersten Embedding kann QMD sein lokales Embedding-Modell herunterladen. Das Modell bleibt im projektlokalen Cache.

## Suchen

Direkt über npm:

```powershell
npm run search -- "Welche Wallbox wird über EVCC gesteuert?"
```

Oder über das mit Windows PowerShell 5.1 kompatible Startskript:

```powershell
.\Start-Suche.ps1
```

Die Frage kann auch direkt übergeben werden:

```powershell
.\Start-Suche.ps1 "Welche Wallbox wird über EVCC gesteuert?"
```

Beide Sucharten werden getrennt ausgeführt: `searchLex()` für BM25 und `searchVector()` für Vektorähnlichkeit. Es gibt keine Query Expansion, kein Reranking und keine Antwortgenerierung.

## Ordner

- `beispielwissen`: zwei vollständig erfundene Markdown-Dokumente
- `qmd-data/config/index.yml`: QMD-Konfiguration mit relativem Dokumentpfad
- `qmd-data/cache/qmd/index.sqlite`: projektlokaler SQLite-Index, wird beim Indexieren erzeugt
- `qmd-data/cache/qmd/models`: projektlokale QMD-Modelle, werden bei Bedarf erzeugt
- `qmd-data/cache`: vollständiger projektlokaler QMD-Cache über `XDG_CACHE_HOME`

`QMD_CONFIG_DIR` und `XDG_CACHE_HOME` werden in jedem Node-Prozess vor dem dynamischen QMD-Import gesetzt. `configPath` und `dbPath` werden aus dem Speicherort der Skripte gebildet. Das Beispiel enthält keine fest codierten Benutzer- oder Installationspfade.

## Grenzen

Dieses Projekt ist bewusst nur ein Minimalbeispiel für direkten QMD-SDK-Zugriff. Es enthält keine Weboberfläche, kein LM Studio, keine RAG-Antwortgenerierung und keine Bestandteile eines produktiven Wissenssystems.

Index, Cache, Modelle, `node_modules`, Protokolle und temporäre Dateien sind von Git und vom freigegebenen ZIP ausgeschlossen. Das ZIP enthält nur Quell- und Konfigurationsdateien sowie die erfundenen Beispieldokumente.

## Projektstatus

Getestet wurde dieses Beispiel unter Windows 11 mit Node.js 22.23.1, npm 10.9.8 und QMD 2.5.3. BM25- und Vektorsuche wurden erfolgreich getestet. Dies ist keine Zusage, dass jede künftige Windows-, Node.js- oder QMD-Version gleich funktioniert.

## Entwicklungshinweis

Dieses Beispielprojekt wurde von Badger B entwickelt und zusammengestellt. Bei der Erstellung wurde KI-Unterstützung verwendet. Der veröffentlichte Code wurde manuell geprüft und unter Windows 11 getestet.

## Lizenz

Dieses Beispielprojekt steht unter der MIT-Lizenz. Es darf verwendet, verändert und weitergegeben werden, sofern der Copyright- und Lizenzhinweis erhalten bleibt. Details stehen in [LICENSE](LICENSE).

## Drittanbieter und Modelle

`@tobilu/qmd` ist eine eigenständige npm-Abhängigkeit und wird nicht in dieses Repository kopiert. QMD 2.5.3 unterliegt seiner eigenen MIT-Lizenz; weitere npm-Abhängigkeiten unterliegen ihren jeweiligen Lizenzen. Automatisch heruntergeladene GGUF-Modelle unterliegen ihren jeweiligen Modelllizenzen. Modelle, Abhängigkeiten und Laufzeitdaten sind nicht Bestandteil der Lizenzierung dieses Beispielcodes.

## Sicherheit und Haftung

Dieses Projekt dient ausschließlich Demonstrations- und Lernzwecken und bietet keine Garantie für die Eignung in Produktivumgebungen. Prüfen Sie den Code und die Abhängigkeiten vor einem produktiven Einsatz selbst. Tragen Sie keine Zugangsdaten in Konfigurationen ein und committen Sie keine Zugangsdaten.

## Bekannte Abhängigkeitswarnungen

Beim geprüften Stand meldete npm drei moderate Warnungen im indirekten Abhängigkeitsbaum von QMD 2.5.3. Es wurde kein potenziell brechendes `npm audit fix --force` ausgeführt. Updates müssen separat getestet werden.
