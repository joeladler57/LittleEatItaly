# Little Eat Italy - PRD

## Admin Access
- **URL**: /admin
- **Username**: admin
- **Password**: LittleEatItaly2024! (ändern nach erstem Login!)

## What's Been Implemented (Feb 17, 2026)

### Pages
- ✅ **Startseite**: Hero mit Maradona Graffiti, Action-Buttons, Features
- ✅ **Über Uns**: Geschichte, Philosophie, Stats
- ✅ **Kontakt**: Erweitertes Formular + Kontaktinfos + Karte
- ✅ **Impressum**: Deutsche Rechtsstandards (§5 TMG, etc.)
- ❌ **Speisekarte**: Entfernt wie gewünscht

### Kontaktformular-Felder
- Name (Pflicht)
- E-Mail (Pflicht)
- Telefonnummer (optional, ein/ausschaltbar)
- Betreff (optional, ein/ausschaltbar)
- Nachricht (Pflicht)

### Admin Dashboard Tabs
1. **STARTSEITE**: Hintergrundbild, Untertitel, 4 Action-Buttons (URLs)
2. **KONTAKT**: Adresse, Telefon, E-Mail, Öffnungszeiten, Formular-Einstellungen
3. **IMPRESSUM**: Titel + Markdown-Inhalt vollständig editierbar
4. **FOOTER**: Lauftext, Beschreibung, Copyright
5. **EINSTELLUNGEN**: Passwort ändern

### API Endpoints
```bash
# Content
GET  /api/content              # Alle Inhalte
PUT  /api/content/hero         # Hero-Bereich
PUT  /api/content/contact      # Kontaktseite
PUT  /api/content/impressum    # Impressum (Markdown)
PUT  /api/content/footer       # Footer
GET  /api/impressum            # Nur Impressum

# Auth
POST /api/auth/login           # Admin Login
GET  /api/auth/verify          # Token prüfen
POST /api/auth/change-password # Passwort ändern

# Kontakt
POST /api/contact              # Nachricht senden
GET  /api/contact              # Alle Nachrichten
```

## Next Tasks
1. E-Mail-Benachrichtigung bei neuen Kontaktanfragen
2. Bildergalerie hinzufügen
3. Social Media Links im Footer editierbar machen
