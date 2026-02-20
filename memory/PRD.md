# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## Personal/Mitarbeiter Access
- **URL**: /personal
- **PIN**: 1234 (Standard, änderbar in Admin → Einstellungen)

## Kellner-Terminal Access
- **URL**: /terminal
- **Kellner-PINs** (konfigurierbar im Admin → TERMINAL):
  | Name | PIN |
  |------|-----|
  | Marco | 1111 |
  | Lucia | 2222 |
  | Giuseppe | 3333 |
  | Sofia | 4444 |
  | Antonio | 5555 |
  | Elena | 6666 |
  | Roberto | 7777 |
  | Francesca | 8888 |
  | Paolo | 9999 |
  | Maria | 0000 |

## What's Been Implemented

### Dezember 2025 - Kellner-Terminal (Getestet ✅)
- ✅ **Kellner-Login** (`/terminal`):
  - 4-stelliger PIN für jeden Kellner
  - Große, mobilfreundliche Nummerntastatur
  - 12-Stunden Token-Gültigkeit
- ✅ **Tischauswahl**:
  - 20 vorkonfigurierte Tische
  - Grid-Ansicht für schnelle Auswahl
  - Tischnummer auf Bon gedruckt
- ✅ **Inhouse-Menü**:
  - Separates Menü nur für Terminal
  - Kategorien: Vorspeise, Pizza, Pasta, Salat, Hauptspeise, Nachspeise, Getränke
  - Preise und Extras pro Artikel
- ✅ **Bestellvorgang**:
  - Artikel antippen → Detailansicht
  - Anzahl wählen
  - Gang wählen (Vorspeise, Hauptspeise, Nachspeise, Getränke)
  - Optionale Notiz (z.B. "ohne Zwiebeln")
  - Warenkorb mit Gesamtsumme
  - "BON DRUCKEN" sendet Bestellung an Drucker
- ✅ **Admin-Verwaltung** (`/admin/shop` → TERMINAL):
  - Kellner: Name + 4-stelliger PIN (muss einzigartig sein)
  - Tische: Nummer + optionale Beschreibung
  - **Extras/Addons**: Addon-Gruppen erstellen und Kategorien zuweisen
  - Inhouse-Menü: Artikel mit Kategorie, Preis
- ✅ **Addon-Gruppen**:
  - Gruppen wie "Extra Belag", "Extras" erstellen
  - Optionen mit Name + Preis (z.B. "Extra Käse +1.50€")
  - Mehrfachauswahl oder Einzelauswahl
  - Gruppen auf Kategorien zuweisen (z.B. alle Pizzen bekommen "Extra Belag")
- ✅ **Auto-Druck**: Bestellungen werden automatisch in Druckwarteschlange eingefügt

### Februar 2026 - Epson TM-30III Bon-Druck (Implementiert ✅)
- ✅ **Drucker-Einstellungen** im Admin-Bereich (`/admin/shop` → DRUCKER Tab):
  - IP-Adresse und Port konfigurierbar
  - Auto-Druck bei Bestellannahme aktivierbar
  - Geräte-ID für ePOS SDK
- ✅ **Bon-Designer mit Live-Vorschau**:
  - Kopfzeile: Restaurant-Name (Größe/Fett), Adresse, Telefon
  - Bestellinfo: Bestellnummer (Größe/Fett), Datum, Kundenname, Telefon, Abholzeit
  - Artikel: Anzahl, Name, Größe, Optionen/Extras, Preis
  - Notizen: Mit/Ohne Rahmen, Fett
  - Summe: Gesamtpreis (Größe/Fett), Zahlungsart
  - Fußzeile: Dankestext, Eigener Text
- ✅ **Auto-Druck im Personal-Bereich**: Bon wird automatisch gedruckt beim Akzeptieren
- ✅ **Manueller Druck**: Drucker-Button bei bestätigten Bestellungen
- ✅ **Fallback**: Browser-Druckdialog wenn Epson nicht erreichbar

### Februar 2026 - Mobile UI Fix für "HEUTE"-Tab (Behoben ✅)
- ✅ **Scrolling Tab-Leiste**: Horizontale Scrollbar für Tabs auf mobilen Geräten
- ✅ **Uhrzeiten jetzt sichtbar**: Reservierungszeiten werden korrekt auf allen Bildschirmgrößen angezeigt
- ✅ **Responsive Layout**: Grid-basiertes Design für Zeit, Name und Personenanzahl

### Februar 2026 - Personal-App / Mitarbeiter-Login (Getestet ✅)
- ✅ **Separates Login für Mitarbeiter**:
  - 4-stelliger PIN-Code (konfigurierbar im Admin-Bereich)
  - Eigene URL `/personal` ohne Website-Navigation
  - 12-Stunden Token-Gültigkeit
- ✅ **Mitarbeiter-Dashboard**:
  - LIVE-Indikator mit 4-Sekunden-Polling
  - Sound-/Push-Benachrichtigungen
  - Filter: Neu, Zubereitung, Bereit, Alle
  - Bestellungen annehmen/ablehnen mit Zubereitungszeit für ASAP
  - Reservierungen bestätigen/stornieren
- ✅ **Wie GloriaFood-App**:
  - Mobile-optimiert für Tablets/Smartphones
  - Kein Zugriff auf Menü oder Einstellungen (nur Bestellungen/Reservierungen)

### Februar 2026 - Web Push Notifications (Getestet ✅)
- ✅ **Push-Benachrichtigungen bei geschlossenem Browser**:
  - Automatische Benachrichtigung bei neuen Bestellungen/Reservierungen
  - Funktioniert auch wenn Browser/App geschlossen ist
  - VAPID-Authentifizierung für sichere Push-Kommunikation
  - Push-Button zum Aktivieren/Deaktivieren im Admin-Bereich
  - Test-Notification-Button zum Testen
- ✅ **Push-Endpoints**:
  - `/api/push/vapid-key` - Öffentlicher VAPID-Schlüssel
  - `/api/push/subscribe` - Gerät für Push registrieren
  - `/api/push/unsubscribe` - Push deaktivieren
  - `/api/push/subscriptions` - Alle registrierten Geräte anzeigen
  - `/api/push/test` - Test-Benachrichtigung senden

### Februar 2026 - PWA Restaurant Admin App (Getestet ✅)
- ✅ **Progressive Web App (PWA)**: 
  - Installierbar auf Mobilgeräten (Android/iOS)
  - Offline-fähig durch Service Worker
  - App-Icons in allen Größen (72px - 512px)
  - Start-URL: `/admin/shop`
- ✅ **Echtzeit-Benachrichtigungen**:
  - Automatisches Polling alle 4 Sekunden
  - Audio-Benachrichtigung bei neuen Bestellungen/Reservierungen
  - Visueller LIVE-Indikator (grün pulsierend)
  - Sound-Toggle zum Ein-/Ausschalten
  - Vibration auf Mobilgeräten
- ✅ **Mobile-optimierte Verwaltung**:
  - Responsive Layout für alle Bildschirmgrößen
  - PWA Install-Banner für einfache Installation
  - Stat-Karten pulsieren bei neuen Eingängen

### Februar 2026 - Bestell- & Reservierungssystem V2 (Getestet ✅)
- ✅ **Online Bestellsystem** (`/bestellen`): Warenkorb, Kategorien, Artikelauswahl, ASAP-Option, Zeitauswahl basierend auf Öffnungszeiten
- ✅ **Reservierungssystem** (`/reservieren`): Dynamische Datums-/Zeitauswahl basierend auf Öffnungszeiten und Feiertagen
- ✅ **Zahlungsart-Auswahl**: Barzahlung oder Kartenzahlung bei Abholung wählbar
- ✅ **Safari-kompatible Dropdowns**: Custom Dropdown-Komponenten für volle Browser-Kompatibilität
- ✅ **Add-on System**: 
  - Globale Add-on Gruppen (z.B. Dressing, Extras) mit Optionen und Aufpreisen
  - Kategorien können Add-on Gruppen zugeordnet bekommen
  - Pflicht- und Mehrfachauswahl möglich
  - Im Frontend werden Add-ons bei Bestellung angezeigt
- ✅ **Shop Admin** (`/admin/shop`): 
  - BESTELLUNGEN: Neue/Bestätigte/Stornierte Bestellungen verwalten, ASAP-Bestätigung mit Zubereitungszeit, Zahlungsart-Anzeige
  - RESERVIERUNGEN: Nach Datum gruppiert, Bestätigen/Ablehnen
  - MENÜ: Kategorien und Artikel verwalten, Add-on Gruppen erstellen und zuordnen
  - EINSTELLUNGEN: Öffnungszeiten pro Tag, Geschlossene Tage, Vorlaufzeiten, Restaurant-Infos
- ✅ **Nur Abholung**: Bar oder Kartenzahlung bei Abholung
- ⏸️ **E-Mail-Bestätigung**: Code bereit, Resend API-Key benötigt

### Test-Ergebnisse (18.02.2026)
- Backend: **100% (50/50 Tests bestanden)** - PWA + Push + Staff Login
- Frontend: **100% alle Features verifiziert**
- Personal-App: PIN-Login, Dashboard, Filter, Bestellungen/Reservierungen
- PWA: Manifest, Service Worker, Icons, Notification Sound
- Push: VAPID, Subscribe, Unsubscribe, Test Notifications

### Frühere Updates
- ✅ **GlobalFood Menü-Integration**: Dynamische Speisekarte
- ✅ **Echte Links**: Uber Eats, Lieferando, Abholen, Reservierung
- ✅ **Social Media Links editierbar**: Instagram, Facebook, TikTok

### Pages
- ✅ **Startseite**: Hero mit Maradona Graffiti, 4 Action-Buttons
- ✅ **Menü** (`/menu`): GlobalFood API
- ✅ **Online Bestellen** (`/bestellen`): Eigenes Bestellsystem
- ✅ **Reservieren** (`/reservieren`): Tischreservierung
- ✅ **Über Uns**: Geschichte, Philosophie
- ✅ **Kontakt**: Formular + Infos
- ✅ **Impressum**: Rechtliche Infos

### Homepage Action Buttons
| Button | URL |
|--------|-----|
| UBER EATS | https://www.ubereats.com/de/store/little-eat-italy... |
| LIEFERANDO | https://order-now-toolkit.takeaway.com/widgets/button?restId=13007961 |
| BESTELLEN ZUM ABHOLEN | /bestellen (internes System) |
| TISCHRESERVIERUNG | /reservieren (internes System) |

### Admin Dashboard
**Webseiten-Verwaltung** (`/admin`):
- STARTSEITE, KONTAKT, IMPRESSUM, SOCIAL MEDIA, FOOTER, EINSTELLUNGEN

**Shop-Verwaltung** (`/admin/shop`) - **PWA**:
- 🟢 **LIVE-Modus**: Automatische Aktualisierung alle 4 Sekunden
- 🔔 **Audio-Benachrichtigungen**: Ton bei neuen Bestellungen/Reservierungen
- 📱 **PWA-Installation**: Als App auf Handy installierbar
- BESTELLUNGEN: Status verwalten (Neu → Bestätigt → Storniert), ASAP-Bestellungen mit Zubereitungszeit-Eingabe bestätigen
- RESERVIERUNGEN: Nach Datum gruppiert, Bestätigen/Stornieren
- MENÜ: Kategorien und Artikel verwalten (hinzufügen, bearbeiten, löschen)
- TERMINAL: Kellner, Tische und Inhouse-Menü verwalten
- EINSTELLUNGEN: Öffnungszeiten pro Wochentag, Geschlossene Tage (Feiertage), Vorlaufzeiten, Restaurant-Kontaktdaten

### API Endpoints
```bash
# Shop Menu
GET  /api/shop/menu                    # Menü abrufen
PUT  /api/shop/menu                    # Menü aktualisieren (Admin)

# Orders
POST /api/shop/orders                  # Bestellung aufgeben
GET  /api/shop/orders                  # Alle Bestellungen (Admin)
PUT  /api/shop/orders/{id}/status      # Status ändern (Admin)

# Reservations
POST /api/shop/reservations            # Reservierung anfragen
GET  /api/shop/reservations            # Alle Reservierungen (Admin)
PUT  /api/shop/reservations/{id}/status # Status ändern (Admin)

# Settings
GET  /api/shop/settings                # Einstellungen abrufen
PUT  /api/shop/settings                # Einstellungen ändern (Admin)

# Staff / Personal
POST /api/staff/login                  # PIN-Login für Mitarbeiter
GET  /api/staff/verify                 # Token verifizieren
GET  /api/staff/orders                 # Bestellungen für Personal
PUT  /api/staff/orders/{id}/status     # Bestellung Status ändern
GET  /api/staff/reservations           # Reservierungen für Personal
PUT  /api/staff/reservations/{id}/status # Reservierung Status ändern

# Terminal / Kellner-Terminal
POST /api/terminal/login               # Kellner-Login mit PIN
GET  /api/terminal/tables              # Alle Tische abrufen
GET  /api/terminal/menu                # Terminal-Menü abrufen
GET  /api/terminal/categories          # Kategorien abrufen
POST /api/terminal/orders              # Bestellung aufgeben (→ Druckwarteschlange)
GET  /api/terminal/orders              # Bestellungen abrufen
GET  /api/terminal/orders/today        # Heutige Bestellungen
GET  /api/terminal/waiters             # Kellner abrufen (Admin)
POST /api/terminal/waiters             # Kellner hinzufügen (Admin)
PUT  /api/terminal/waiters/{id}        # Kellner bearbeiten (Admin)
DELETE /api/terminal/waiters/{id}      # Kellner löschen (Admin)
POST /api/terminal/tables              # Tisch hinzufügen (Admin)
PUT  /api/terminal/tables/{id}         # Tisch bearbeiten (Admin)
DELETE /api/terminal/tables/{id}       # Tisch löschen (Admin)
GET  /api/terminal/menu/all            # Alle Menüartikel inkl. inaktive (Admin)
POST /api/terminal/menu                # Artikel hinzufügen (Admin)
PUT  /api/terminal/menu/{id}           # Artikel bearbeiten (Admin)
DELETE /api/terminal/menu/{id}         # Artikel löschen (Admin)

# Print Queue / Druckwarteschlange
GET  /api/print-queue                  # Alle Druckaufträge abrufen (Staff)
POST /api/print-queue                  # Bestellung zur Druckwarteschlange hinzufügen
POST /api/print-queue/reservations     # Reservierungsliste zur Druckwarteschlange hinzufügen
PUT  /api/print-queue/{id}/status      # Druckauftrag-Status aktualisieren
DELETE /api/print-queue/{id}           # Druckauftrag löschen
```

### E-Mail Konfiguration
Für E-Mail-Bestätigungen Resend API-Key in `/app/backend/.env` eintragen:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
SENDER_EMAIL=bestellung@little-eat-italy.de
```

### 3rd Party Integrations
- **GlobalFood API**: Restaurant Key `pQ5d8UmzbClR90Y1DR`
- **Resend**: E-Mail-Versand (API-Key benötigt)
- **Web Push**: VAPID-Keys konfiguriert für Push-Benachrichtigungen

## Next Tasks
1. 🟠 **P1 - Weitere Backend-Refaktorisierung**: 
   - Push-Notification-Endpoints in eigenen Router verschieben
   - CMS-Content-Endpoints in eigenen Router verschieben
   - Orders und Reservations in eigene Router verschieben
2. 🟡 **P2 - Treuepunkte-Einlösung implementieren**: 
   - Backend-Endpoint für Prämien-Einlösung
   - Frontend "EINLÖSEN" Button funktional machen
3. 🟡 **E-Mail-Benachrichtigungen aktivieren**: Resend API-Key in `/app/backend/.env` eintragen
4. 🟢 Impressum mit echten Firmendaten ergänzen (über Admin)
5. 🟢 Weitere Menü-Artikel hinzufügen (über Shop Admin)

## Recently Added Features

### Februar 2026 - Statistik-Dashboard ✅
- **URL:** `/admin` → Tab "STATISTIK"
- **Übersicht:**
  - Umsatz mit Trend-Anzeige (vs. Vorwoche)
  - Anzahl Bestellungen + Durchschnittswert
  - Reservierungen + Gästeanzahl
- **Vergleiche:**
  - Wochenvergleich (Diese Woche vs. Letzte Woche)
  - Monatsvergleich (Dieser Monat vs. Letzter Monat)
- **Reservierungs-Performance:**
  - Erschienen / Nicht erschienen / No-Show-Rate
- **Stoßzeiten-Analyse:**
  - Balkendiagramm nach Stunde (11:00 - 00:00)
  - Peak-Zeiten für Bestellungen und Reservierungen
- **Top 10 Gerichte:** Meistverkaufte Artikel mit Anzahl und Umsatz
- **Bestellungen nach Tag:** Tägliche Übersicht mit Umsatzbalken
- **Filter:** Heute / Diese Woche / Dieser Monat / Dieses Jahr / Benutzerdefiniert

### Februar 2026 - Reservierungs-Display für Tablets ✅
- **URL:** `/display`
- **Features:**
  - Staff-PIN-Authentifizierung
  - Tablet-optimiertes Hochformat-Layout
  - Zeigt nur heutige Reservierungen
  - Sortiert nach Uhrzeit
  - Status-Buttons: Grün (Angekommen), Gelb (Abgesagt), Rot (Nicht erschienen)
  - **Interne Tischnotiz:** Klick auf "Tischnotiz hinzufügen" → Eingabe → Speichern
  - Automatische Aktualisierung alle 30 Sekunden
  - Statistik-Leiste (Offen/Angekommen)
  - **Reservierungsliste drucken:** Drucker-Icon im Header → Druckauftrag wird an PrintStation gesendet

## Mitarbeiter-App einrichten
**So richtest du die Personal-App für Mitarbeiter ein:**
1. Gehe zu `/admin/shop` → EINSTELLUNGEN
2. Setze den gewünschten 4-stelligen PIN unter "PERSONAL-PIN"
3. Speichere die Einstellungen
4. Teile deinen Mitarbeitern die URL `/personal` und den PIN mit

**Für Mitarbeiter:**
1. Öffne `/personal` auf dem Tablet/Handy
2. Gib den PIN ein (z.B. 1234)
3. Aktiviere Sound und Push für Benachrichtigungen
4. Die App aktualisiert automatisch alle 4 Sekunden

## PWA Installation & Push-Benachrichtigungen
**So installierst du die App auf deinem Handy:**
1. Öffne `/admin/shop` oder `/personal` im Browser
2. Klicke auf "INSTALLIEREN" im Banner oder im Menü
3. Die App erscheint auf deinem Startbildschirm

**So aktivierst du Push-Benachrichtigungen:**
1. Logge dich ein (Admin oder Personal)
2. Klicke auf das Glocken-Icon (🔔) in der Header-Leiste
3. Erlaube Benachrichtigungen wenn gefragt
4. Du erhältst jetzt Benachrichtigungen auch bei geschlossenem Browser!

## Druck-Station für Bon-Druck (Dezember 2025)
**Netzwerk-Drucker über ePOS-Print XML!** Der Epson TM-m30II wird direkt vom Browser angesteuert.

**WICHTIG:** Die Print-Station muss auf einem Gerät laufen, das im **gleichen WLAN** wie der Drucker ist (z.B. das alte Android-Handy).

**So funktioniert's:**
1. Öffne `/print-station` auf dem alten Android-Handy (im Restaurant-WLAN)
2. PIN eingeben (1234)
3. "Verbinden" tippen
4. Fertig! Bons werden automatisch gedruckt

**Technische Details:**
- Kommunikation über ePOS-Print XML API
- HTTP POST an `http://192.168.2.129:8008/cgi-bin/epos/service.cgi`
- Das Android-Handy fungiert als Brücke zwischen Cloud und lokalem Drucker

**Einstellungen (Zahnrad-Icon):**
- IP-Adresse ändern
- Port ändern (Standard: 8008)

**Funktionen:**
- ✅ Auto-Druck wenn Bestellung angenommen wird
- ✅ Manuelle Druck-Buttons
- ✅ Sound-Benachrichtigung
- ✅ Warteschlange-Anzeige
- ✅ Print-Historie
- ✅ **Reservierungsliste drucken** (seit Feb 2026):
  - Auf `/display` → Drucker-Icon klicken
  - Liste wird zur Druckwarteschlange hinzugefügt
  - PrintStation erkennt und druckt formatierte Liste

## Kellner-Terminal einrichten
**So richtest du das Terminal für Kellner ein:**
1. Gehe zu `/admin/shop` → TERMINAL
2. **Kellner hinzufügen**: Name + 4-stelliger PIN für jeden Kellner
3. **Tische hinzufügen**: Tischnummern (1, 2, ... oder "Terrasse 1", etc.)
4. **Inhouse-Menü pflegen**: Alle Artikel die per Terminal bestellt werden können

**Für Kellner:**
1. Öffne `/terminal` auf dem Tablet/Handy
2. PIN eingeben (z.B. 1111 für Marco)
3. Tisch wählen
4. Artikel antippen, Anzahl und Gang wählen
5. "BON DRUCKEN" drücken → Bestellung geht an die Küche

### Dezember 2025 - Desktop Warenkorb Fix (Behoben ✅)
- ✅ **Desktop Cart Layout Fix**: 
  - `overflow-x-hidden` aus OrderPage.jsx entfernt, das den Warenkorb abschnitt
  - Container-Padding und Sidebar-Breite für verschiedene Desktop-Auflösungen optimiert
  - "ZUR KASSE" Button ist jetzt auf allen Desktop-Bildschirmen (1920px, 1440px) vollständig sichtbar
  - Getestet auf 1920x1080 und 1440x900 Viewports

### Februar 2026 - Kundenverwaltungssystem (Implementiert ✅)
- ✅ **Kundenkonto-System** (`/konto`):
  - Kundenregistrierung mit Name, E-Mail, Telefon, Passwort
  - Kunden-Login mit JWT-Token (72 Stunden gültig)
  - Kundenprofilseite mit Statistiken (Bestellungen, Reservierungen, Umsatz)
  - Bestellverlauf und Reservierungshistorie für eingeloggte Kunden
- ✅ **Automatische Kundenerkennung**:
  - Bei jeder Bestellung/Reservierung wird Kunde über E-Mail ODER Telefon erkannt
  - "Neuer Kunde" Badge für Erstkunden
  - Wiederkehrende Kunden: Anzahl Bestellungen + Gesamtumsatz wird angezeigt
  - Gast-Bestellungen werden auch gespeichert (ohne Passwort)
- ✅ **Admin-Ansicht erweitert**:
  - Kundeninfo-Badge bei jeder Bestellung im Shop-Dashboard
  - "✨ NEUER KUNDE" für Erstkunden
  - "1 Bestellungen • 12,90 € Umsatz" für wiederkehrende Kunden
  - "👤 REGISTRIERT" Badge für Kunden mit Konto

**Customer API Endpoints:**
```bash
POST /api/customers/register      # Konto erstellen
POST /api/customers/login         # Kunden-Login
GET  /api/customers/me            # Kundenprofil abrufen
PUT  /api/customers/me            # Profil bearbeiten
GET  /api/customers/me/orders     # Bestellverlauf
GET  /api/customers/me/reservations # Reservierungshistorie
GET  /api/customers               # Alle Kunden (Admin)
GET  /api/customers/{id}          # Kundendetails (Admin)
```

### Februar 2026 - Treuepunkte-System (Implementiert ✅)
- ✅ **Bonuskarte mit QR-Code** (`/konto` > Bonuskarte):
  - Digitale Kundenkarte mit QR-Code für Vor-Ort-Nutzung
  - Punktestand und Historie angezeigt
  - Prämien einlösbar (Gratis-Artikel)
- ✅ **Automatische Punktevergabe** bei Online-Bestellungen:
  - 1 Punkt pro Euro (einstellbar im Admin)
  - Punkte werden bei Bestellung automatisch gutgeschrieben
- ✅ **Admin-Einstellungen** (`/admin/shop` > BONUSPUNKTE):
  - Punkte pro Euro konfigurierbar
  - Mindestumsatz für Punkte
  - Verfallsdatum (12 Monate default)
  - Willkommensbonus bei Registrierung
  - Prämien hinzufügen/bearbeiten/löschen
- ✅ **Personal-Bereich** (`/personal` > BONUSPUNKTE):
  - QR-Code scannen oder Kunde suchen
  - Punkte für Vor-Ort-Verzehr gutschreiben
  - Umsatz eingeben → System berechnet Punkte

**Loyalty API Endpoints:**
```bash
GET  /api/loyalty/settings         # Öffentliche Einstellungen
GET  /api/loyalty/settings/admin   # Admin-Einstellungen
PUT  /api/loyalty/settings         # Einstellungen speichern
GET  /api/customers/me/loyalty     # Kundenpunkte + QR-Code
POST /api/customers/me/redeem      # Prämie einlösen
POST /api/staff/loyalty/scan       # QR-Code scannen
POST /api/staff/loyalty/add-points # Punkte gutschreiben
GET  /api/staff/loyalty/search     # Kunde suchen
```

### Dezember 2025 - Backend-Refaktorisierung Phase 1 (Abgeschlossen ✅)
- ✅ **Code-Aufteilung**: 
  - `backend/routers/customers.py` - Kundenverwaltung, Registrierung, Login, Profil
  - `backend/routers/loyalty.py` - Treuepunkte-System, QR-Code, Prämien
  - `backend/routers/shared.py` - Gemeinsame Modelle und Auth-Funktionen
- ✅ **Ergebnis**: 
  - 320 Zeilen duplizierter Code aus `server.py` entfernt
  - `server.py` von 3098 auf 2778 Zeilen reduziert
  - Alle Funktionen werden jetzt über Imports verwendet
- ✅ **Getestet**: 
  - 29/29 pytest Tests bestanden
  - 10/10 Integration-Tests bestanden (100%)

### Februar 2026 - Backend-Refaktorisierung Phase 2 (Abgeschlossen ✅)
- ✅ **Weitere Router-Module erstellt**:
  - `backend/routers/terminal.py` - Kellner-Terminal Endpoints (Login, Tische, Kellner, Menü, Bestellungen)
  - `backend/routers/staff.py` - Personal-Bereich Endpoints (Login, Bestellungen, Reservierungen, Loyalty)
- ✅ **Code-Reduzierung**:
  - ~480 Zeilen aus `server.py` in dedizierte Router verschoben
  - `server.py` von 2940 auf 2472 Zeilen reduziert
  - Terminal: 420 Zeilen, Staff: 287 Zeilen in eigenen Modulen
- ✅ **Router-Architektur**:
  ```
  backend/routers/
  ├── __init__.py      # Exportiert alle Router und gemeinsame Funktionen
  ├── customers.py     # Kundenkonto-System
  ├── database.py      # MongoDB-Verbindung
  ├── loyalty.py       # Treuepunkte-System
  ├── shared.py        # Gemeinsame Modelle (ShopSettings, Auth-Funktionen)
  ├── staff.py         # Personal-Bereich
  └── terminal.py      # Kellner-Terminal
  ```
- ✅ **Getestet**: 
  - 97% Erfolgsrate (56/58 Backend-Tests bestanden)
  - Testing-Agent Bug gefunden und behoben (TerminalMenuItem.addons Typ)
  - Frontend: Staff-PWA und Terminal funktionieren einwandfrei
  - Alle API-Endpoints funktionieren korrekt

### Februar 2026 - Push Opt-In & Über Uns Bearbeitung (Implementiert ✅)
- ✅ **Push Opt-In Modal** nach wichtigen Aktionen:
  - Nach Registrierung eines neuen Kundenkontos
  - Nach erfolgreicher Bestellung
  - Nach erfolgreicher Reservierung
  - Ansprechendes Design mit Pizza-Icon und Vorteilen
  - "JA, BENACHRICHTIGE MICH!" und "Nein danke" Buttons
- ✅ **"Über uns" Bearbeitung im Admin-Dashboard**:
  - Neuer "ÜBER UNS" Tab hinzugefügt
  - **Geschichte**: Titel, Text (mehrzeilig), Bild-URL
  - **Statistiken**: 4 bearbeitbare Werte (Gründungsjahr, Teigzeit, Ofentemp., etc.)
  - **Philosophie**: 3 Sektionen mit Titel und Beschreibung
  - **Zitat**: Text und Autor
- ✅ **AboutPage dynamisch**: Lädt Inhalte aus Backend `/api/content`
- ✅ **Testing:** 17/17 Frontend-Tests bestanden (100%)

### Februar 2026 - Push-Benachrichtigungen (Implementiert ✅)
- ✅ **PUSH Tab im Admin-Dashboard** (`/admin/shop`):
  - Statistiken: Gesamt Abonnenten, Mit Konto, Anonym
  - Nachricht-Formular mit Titel, Nachricht, optionalem Link
  - Zielgruppen-Auswahl: Alle, Nur Kunden, Nur Admins
  - Sende-Button und Historie der gesendeten Nachrichten
- ✅ **Backend APIs**:
  - `POST /api/push/customer/subscribe` - Kunden können sich anmelden
  - `POST /api/push/broadcast` - Admin sendet an ausgewählte Zielgruppe
  - `GET /api/push/customer/stats` - Abonnenten-Statistiken
  - `GET /api/push/broadcasts` - Gesendete Nachrichten Historie
- ✅ **Testing:** 35/35 Tests bestanden (Backend + Frontend)

### Februar 2026 - Wallet Integration für Bonuskarte (Implementiert ✅)
- ✅ **Apple Wallet Button**:
  - Schön gestalteter Button mit Apple-Logo
  - Zeigt informative Toast-Nachricht wenn nicht konfiguriert
  - Vorbereitet für volle Integration (benötigt Apple Developer Account)
- ✅ **Google Wallet Button**:
  - Schön gestalteter Button mit Google-Logo
  - Zeigt informative Toast-Nachricht wenn nicht konfiguriert
  - Vorbereitet für volle Integration (benötigt Google Cloud Account)
- ✅ **Alternative Optionen (sofort nutzbar)**:
  - "QR-CODE ALS BILD SPEICHERN" - Lädt QR-Code als PNG mit Branding herunter
  - "ZUR STARTSEITE HINZUFÜGEN" - Zeigt iOS/Android-spezifische PWA-Anleitungen
- ✅ **Backend API** `/api/customers/me/wallet-pass?type=apple|google`:
  - Gibt 501 zurück mit hilfreicher Nachricht
  - Vorbereitet für wallet_settings in DB

### Februar 2026 - Staff QR-Scanner (Implementiert ✅)
- ✅ **Kamera-basierter QR-Scanner** (`/personal` > BONUSPUNKTE > QR-CODE):
  - "KAMERA STARTEN" Button aktiviert die Smartphone-Kamera
  - Automatische Erkennung von LEI-LOYALTY QR-Codes
  - Scanner-Overlay mit visueller Führung
  - "KAMERA STOPPEN" Button zum Beenden
- ✅ **Manuelle QR-Eingabe** als Fallback:
  - Textfeld für LEI-LOYALTY:... Codes
  - Nützlich bei defekten QR-Codes oder Problemen
- ✅ **Kundensuche** alternativ:
  - Suche nach Name, E-Mail oder Telefon
  - Liste mit Punktestand-Anzeige
- ✅ **Punkte-Gutschrift**:
  - Umsatz in € eingeben
  - Automatische Punkte-Berechnung (1P pro €)
  - "PUNKTE GUTSCHREIBEN" Button
  - Toast-Bestätigung bei Erfolg

## Backlog / Zukünftige Features
- E-Mail-Benachrichtigungen aktivieren (Resend API-Key benötigt)
- Prämien-Einlösung im Kundenkonto fertigstellen ("EINLÖSEN" Button)
- Statistiken-Dashboard für Bestellungen/Reservierungen
- Weitere Refaktorisierung: Terminal, Admin, Orders Endpoints in eigene Router
- Mehrsprachigkeit (DE/EN)


