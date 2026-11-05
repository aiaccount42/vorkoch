# Vorkoch – Projektanleitung für Agenten

Vorkoch ist eine Meal-Prep-App (Wochenplan, Einkauf, Kochmodus, Rezepte) für Roman und Ayşe.
Sie ist eine einzelne HTML-Datei mit Vanilla-JS (kein Framework), gehostet über GitHub Pages
(`https://aiaccount42.github.io/vorkoch/`) und als PWA auf iPhone (Roman) und Android (Ayşe) installiert.
Sprache der App und der Kommunikation mit Roman: Deutsch, kurz und direkt.

## Aufbau
- `src/` = Quellcode. **Nur hier ändern.**
  - `engine.js` Rezepte, Zutaten, Planung (Raster, Kochtermine, Einkauf, Mengen im Kochmodus)
  - `app.js` Oberfläche, `style.css` Aussehen, `art.js` Grafiken, `extras.js` Sync/Zusatzdaten
  - `build.js` baut alles zusammen, `test*.js` + `smoke.js` sind die Tests
- Hauptordner (`index.html`, `sw.js`, `manifest.webmanifest`, Icons) = **generiertes Ergebnis**, das GitHub Pages ausliefert. Nie von Hand bearbeiten.

## Arbeitsablauf
1. `git pull` (vorher, immer – auch die Claude-App und andere Agenten pushen hier hin).
2. Änderung in `src/` machen.
3. In `src/` ausführen: `node build.js`, danach alle Tests:
   `node test.js; node test-extras.js; node test-sync.js; node smoke.js; node test-sessions.js; node test-amounts.js`
   Alles muss grün sein (test-amounts: 121/121).
4. In `src/build.js` die Zahl `CACHE_V` um 1 erhöhen. Sonst zeigt die installierte App den alten Stand.
5. Committen. **Nicht pushen, bevor Roman es ausdrücklich freigibt.**

## Regeln
- Roman will kleine, klare Änderungen und eine kurze Rückmeldung, was sich geändert hat.
- Keine neuen Abhängigkeiten, kein Framework, alles bleibt eine Datei plus Service Worker.
- Gerichte: Rezepte stehen in `engine.js` (`R({...})`); jede Zutat im Rezept muss in genau einem Schritt auftauchen (siehe `test-amounts.js`).
- Daten-Sync läuft über Firebase (`extras.js`, nur Whitelist-Felder). Bestehende Felder nicht umbenennen.
- Regelmäßige Haushaltsartikel laufen nur noch über den Nachkauf-Tag in Haushalt. Das Sync-Feld `bundles` bleibt erhalten, damit alte Daten und Geräte nicht brechen, hat aber keine Oberfläche mehr.
- Wochenliste für Haushalt: `pubShop()` schreibt nach jedem Abgleich nach `/vorkoch/<code>-einkauf/<Woche>.json` (`{shop, items: [{id, n, q, s, a}]}`). Haushalt liest das von selbst, Felder nicht umbenennen.
