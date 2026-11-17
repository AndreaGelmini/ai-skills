# Imejis + OpenCode: dal template all'automazione grafica

> **Guida documentale · 17 novembre 2026 · Andrea Gelmini**  
> Collegare Imejis a OpenCode tramite MCP, esplorare i template senza modificarli e produrre asset grafici coerenti per i social.

OpenCode è l'ambiente in cui lavora l'agente AI; [Imejis](https://www.imejis.io/) offre template e strumenti grafici; **MCP** è il protocollo che permette ai due sistemi di comunicare.

L'obiettivo non è chiedere ogni volta all'AI «fammi un'immagine», ma costruire un workflow con **template, campi dinamici, stile condiviso e rendering ripetibile**. Per esempio, un carosello LinkedIn (1080 × 1350) e un'immagine YouTube Community (1080 × 1080) con la stessa identità visiva.

> **Nota:** questo è un percorso basato sulla documentazione, non una certificazione di compatibilità con ogni versione di OpenCode o ogni piano Imejis. Verifica comandi, nomi degli strumenti e quota disponibili nel tuo ambiente prima di effettuare operazioni.

## Indice

1. [Collegare il server MCP](#1-collegare-il-server-mcp)
2. [Verificare la connessione e autenticarsi](#2-verificare-la-connessione-e-autenticarsi)
3. [Configurazione manuale: `opencode.json`](#3-configurazione-manuale-opencodejson)
4. [Prima prova: esplorare, senza renderizzare](#4-prima-prova-esplorare-senza-renderizzare)
5. [Permessi per agenti specifici](#5-permessi-per-agenti-specifici)
6. [Dal template all'automazione](#6-dal-template-allautomazione)
7. [Skill `imejis-social-automation`](#7-skill-imejis-social-automation)
8. [Dal carosello LinkedIn allo Short YouTube](#8-dal-carosello-linkedin-allo-short-youtube)
9. [Fonti](#fonti)

## 1. Collegare il server MCP

Apri un terminale nella cartella del progetto in cui vuoi utilizzare Imejis. Registra il server remoto:

```bash
opencode mcp add imejis --url https://api.imejis.io/api/mcp
```

`add` aggiunge la configurazione del server Imejis al progetto. Nelle versioni della CLI che supportano l'opzione `--global`, puoi usarla per configurare il server per più progetti. Se il comando non è riconosciuto, controlla `opencode mcp add --help` e usa la configurazione manuale del punto 3.

## 2. Verificare la connessione e autenticarsi

Per vedere i server MCP configurati e il loro stato:

```bash
opencode mcp list
```

- **`needs authentication`**: il server è registrato, ma devi completare l'accesso.
- **`connected`**: la connessione risulta attiva.

Se serve autenticazione, avvia OAuth:

```bash
opencode mcp auth imejis
```

`auth` apre il flusso di autorizzazione nel browser: accedi al tuo account Imejis e concedi l'accesso richiesto. **Non inserire password o token nel prompt dell'agente.** In OpenCode puoi anche consultare i server dal menu `/mcps`.

Alla fine, ripeti:

```bash
opencode mcp list
```

Il comando è **`auth`**, non `outh`.

## 3. Configurazione manuale: `opencode.json`

Se preferisci gestire la configurazione come file, crea o modifica `opencode.json` nella radice del progetto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "imejis": {
        "type": "remote",
        "url": "https://api.imejis.io/api/mcp"
      }
    }
  }
}
```

- **`imejis`** è il nome locale della connessione.
- **`remote`** indica un server accessibile via rete.
- **`url`** è l'indirizzo dell'endpoint MCP.

Questo esempio riprende la configurazione **V2** presentata nella guida PDF. Se hai già altre impostazioni nel file, **aggiungi** la sezione `mcp.servers` senza cancellarle. Poi esegui `opencode mcp list` e, se necessario, `opencode mcp auth imejis`.

## 4. Prima prova: esplorare, senza renderizzare

Il primo test dovrebbe essere di **sola lettura**. Incolla in OpenCode questo prompt, sostituendo il contenuto fra parentesi graffe con la destinazione che ti interessa:

> Elenca i template con ID, nome e dimensioni. **Non modificare e non renderizzare niente.** Suggerisci una base per **{un post su LinkedIn, una copertina YouTube o una presentazione di progetto}**.

L'agente dovrebbe proporre template con **ID effettivi**, nomi, dimensioni e motivazione della scelta. Il **nome di un template non è il suo ID**: verifica entrambi.

Solo dopo aver scelto la base, chiedi di duplicarla, ispezionare i campi modificabili e applicare lo stile desiderato. Non modificare gli originali.

## 5. Permessi per agenti specifici

**Autenticare Imejis non significa dover dare accesso a tutti gli agenti.** Puoi negare l'uso degli strumenti Imejis a livello generale e prevedere un'eccezione per un agente specializzato, ad esempio `social-designer`.

Ecco l'esempio *di soli permessi e agente*, da integrare nel `opencode.json` del punto 3 mettendo `permissions` e `agents` **allo stesso livello di `mcp`**:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permissions": [
    {
      "action": "imejis_*",
      "resource": "*",
      "effect": "deny"
    }
  ],
  "agents": {
    "social-designer": {
      "description": "Progetta asset social",
      "mode": "primary",
      "permissions": [
        {
          "action": "imejis_*",
          "resource": "*",
          "effect": "ask"
        }
      ]
    }
  }
}
```

I tre effetti possibili sono:

| Effetto | Significato |
| --- | --- |
| `deny` | Blocca l'operazione. |
| `ask` | Richiede la tua approvazione prima di procedere. |
| `allow` | Permette l'operazione senza nuova conferma. |

Nell'esempio, la regola generale **nega** i tool `imejis_*`; per `social-designer`, la regola specifica richiede invece **conferma**. La guida di OpenCode V2 descrive la precedenza delle regole applicabili, incluse quelle dell'agente.

**Attenzione:** controlla i nomi reali dei tool MCP e l'eventuale modalità *Code Mode* (`execute`). Una regola `imejis_*` non intercetta necessariamente ogni possibile azione indiretta. Conserva sempre una conferma esplicita per cancellazioni, creazione di chiavi API e operazioni che potrebbero comportare costi.

## 6. Dal template all'automazione

Quando il primo design funziona, rendilo riutilizzabile:

1. Mantieni un file **`DESIGN.md`** con palette, font, spaziature, tono e regole visive.
2. Duplica i template selezionati, senza modificare quelli originali.
3. Identifica i **campi dinamici** reali (per esempio titolo, sottotitolo e call to action).
4. Controlla la quota mensile disponibile **prima** di chiedere dei render.
5. Esporta e scarica davvero i file, salvandoli in una cartella di progetto.

Un esempio di output:

```text
.imejis/
└── guida-imejis-opencode-2026-11-17/
    ├── linkedin.png
    ├── youtube-community.png
    └── render-manifest.json
```

Con **MCP** puoi progettare e modificare interattivamente; con la **Render API** puoi automatizzare in seguito i render ripetuti. Verifica sempre eventuali crediti o costi: non tutti i passaggi sono gratuiti per ogni piano.

## 7. Skill `imejis-social-automation`

La skill è pubblicata nel repository [AndreaGelmini/ai-skills](https://github.com/AndreaGelmini/ai-skills):

**[Apri `imejis-social-automation` su GitHub](https://github.com/AndreaGelmini/ai-skills/tree/main/skills/imejis-social-automation)**

La skill aiuta un agente a:

- leggere `DESIGN.md` e mantenere coerente l'identità grafica;
- selezionare e duplicare template senza modificare gli originali;
- **verificare i crediti mensili** e, se disponibili, le informazioni necessarie a stimare eventuali costi;
- usare i campi dinamici verificati, senza inventarne i nomi;
- salvare gli asset in `.imejis/{progetto}-{data}/` con un manifest;
- preparare render ripetibili tramite script Node.js e API di Imejis.

Per installarla nel progetto, segui le istruzioni del repository. Il comando previsto è:

```bash
npx skills@latest add AndreaGelmini/ai-skills --skill imejis-social-automation
```

La skill **non è necessaria** per seguire la parte introduttiva di questa guida: è un passo successivo per automatizzare il lavoro.

## 8. Dal carosello LinkedIn allo Short YouTube

Un carosello LinkedIn può essere composto da più slide PNG, esportate poi come **un PDF multipagina** da allegare a un post-documento LinkedIn. Il video YouTube usa invece i **PNG originali**, non il PDF.

La skill include anche [`scripts/carosello-to-short.sh`](https://github.com/AndreaGelmini/ai-skills/blob/main/skills/imejis-social-automation/scripts/carosello-to-short.sh), uno script basato su **FFmpeg** per trasformare le immagini `slide-01.png`, `slide-02.png` ecc. in un MP4 verticale **1080 × 1920** con sfondo di riempimento e dissolvenze.

Esegui dalla cartella della skill, usando il percorso effettivo delle immagini:

```bash
bash scripts/carosello-to-short.sh \
  .imejis/guida-imejis-opencode-2026-11-17/
```

Requisiti: **FFmpeg e FFprobe** installati. Il montaggio usa immagini già esportate: **non richiede nuovi render Imejis**. Lo script non aggiunge automaticamente voce narrante o musica, che puoi integrare in un editor video.

## Fonti

- [OpenCode — MCP Servers](https://opencode.ai/docs/mcp-servers/)
- [OpenCode — Permissions](https://opencode.ai/docs/permissions/)
- [OpenCode — Agents](https://opencode.ai/docs/agents/)
- [Imejis — Generate images with MCP and handoff to automation](https://www.imejis.io/blogs/tutorials/generate-images-claude-mcp#the-handoff-ask-the-ai-to-write-your-automation)
- [Repository delle skill](https://github.com/AndreaGelmini/ai-skills)

---

*Andrea Gelmini · Guida documentale · 17 novembre 2026*
