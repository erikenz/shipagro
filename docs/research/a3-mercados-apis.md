# A3 Mercados APIs: grain market data and brokerage operations

Research for the shipagro CRM and tracker bot. **All sources were accessed on 2026-10-24.**
The text is in English; Spanish product, method, and field names are kept as published.

Each finding is marked as:

- **Confirmed**: stated in the cited primary source.
- **Inferred**: my reading of the cited sources; not stated outright.
- **Unknown**: not found in public sources. These are collected in [§8](#8-open-questions-for-a3-sales-and-support).

Citations such as ([D1]) link to the source list in [§9](#9-sources).

> **Naming correction.** A3 Mercados comes from the merger of **Matba Rofex and MAE (Mercado Abierto Electrónico)**, not MAV. Both shareholder meetings approved it on 20/11/2024 ([R3]), and CNV calls A3 "la fusión de MAE y Matba Rofex" ([R4]). A3 Mercados S.A. holds CNV Matrícula 13 ([R5]). Derivatives are cleared by **Argentina Clearing y Registro S.A. (ACyRSA)**, "la empresa del grupo que realiza el clearing" ([P1]); newer docs call it "A3 CCP" ([D5]). Most of the API documentation that A3 links to is written by **Primary** and hosted on `primary.com.ar` ([A1], [D1]). **Confirmed.**

---

## 1. Summary for the architecture

1. **Real-time grain quotes are only available through the Trading API (Primary PTP), over WebSocket or FIX.** The REST `marketdata/get` call returns a snapshot that should be polled no more than once per second. The docs say real-time quotes "será necesario que el consumo se haga a través de Websocket". Production endpoints: `api.primary.com.ar:443` for REST/WS and `fixgw.ptp.primary.com.ar:9876` for FIX. **Confirmed** ([D1], [D10], [P2])
2. **Production credentials are not self-service.** Network access and platform users go only to "Participantes autorizados", via operaciones@a3mercados.com.ar, after certification. The only self-service environment is the reMarkets sandbox: free, instant sign-up, fictitious money, and, per A3, replicated listed contracts and liquidity ([§1a](#1a-test-environment-for-the-demo-remarkets)). **Confirmed** ([D10], [P6], [P8]). The docs don't say whether a non-member SaaS can get its own production market-data user, or whether it must go through a member agent (DMA/ISV under Aviso 530) or a listed vendor (Bloomberg, CMA, FastMarkets, LSEG, ICE, Vantek). **Unknown** ([D12], [A2])
3. **The license is the main open question.** **Confirmed:** A3's fee schedule says "Arancel por Difusión y Distribución de Información de Mercado: NO ARANCELADO", and the Manual de Conectividad says derivatives market data is published free and in real time ([D11], [D10]). **Confirmed:** CNV rules give free real-time data to the market's *Agentes miembros* for their exclusive use. Any third-party use or redistribution needs an agreement with the market, under published fees capped by CNV ([R1], [R2]). **Unknown:** I found no A3 data license, no display vs non-display policy, no delayed-data exemption, and no per-user fee. Get written terms from A3 before showing quotes to staff at many tenant companies.
4. **Without membership, free data is limited to indices and end-of-day prices.**
   - **Confirmed:** the API de Índices is free; you register and wait for approval. It provides I.SOJA, I.MAIZ, and I.TRIGO (continuous indices, updated every minute) and SOJ.A3, which includes the *precio de ajuste* of each SOJ.ROS position in the index ([D6], [D7], [D8]).
   - **Confirmed:** the Post Trade `MarketData` method returns end-of-day settlement prices, closing prices, volume, and open interest, and the "Público" role may call it ([D4]). **Unknown:** how to get a Público user.
   - **Unknown:** reuse terms for the public web viewers (Visor de precios, A3 Live, marketdata.mae.com.ar). None of them is an API ([A10]).
5. **A3 data covers only business registered at A3, and you need credentials for each account.** **Confirmed:** the Post Trade API (API BO / Anywhere Portfolio, REST, run by Argentina Clearing) exposes:
   - trades (`TradeCaptureReport`)
   - end-of-day positions, including PAF G "a fijar" positions (`PositionReport`)
   - the physical-delivery workflow: cupos (`DeliveryQuotaRegistration`), ofertas (`AllocationInstruction`), and carátulas (`AllocationReport`)
   - margins and invoices

   Each user sees only the accounts it is authorized for. That means agent users, or a comitente who requests access through a ticket that needs no ALyC signature ([D4]). **Inferred:** physical grain contracts that never pass through A3 are not in this data. Those contracts are reported to SIO-Granos ([X3]).
6. **Post Trade data is mostly end-of-day.** Final trades, positions, settlement prices, and margins appear after ACyRSA's daily processes finish. `ClosingProcesses` reports when each process is done: `ProcessTypeCode` 1 for trades, 2 for positions and margins, 23 for settlement prices. Only provisional trades (*Transitorias* and *Anuladas*) are meant to be polled intraday, at up to 12 requests per minute. Going over a limit returns HTTP 429. **Confirmed** ([P3], [D4])
7. **The REST/WebSocket API gives you little to detect stale data or gaps.**
   - **Confirmed:** the docs describe no sequence numbers, no replay, and no market-status messages ([D1]).
   - **Confirmed:** the WS `Md` example has no message timestamp. In REST, some entries (LA, SE, OI, CL) carry a `date` in epoch milliseconds ([D1]).
   - **Confirmed:** clients should send a ping every 30 s and open one connection per day ([P2]).
   - **Confirmed:** FIX does have sequence numbers, `ResendRequest`, `TradingSessionStatus` (h), and `SecurityStatus` (f, which reports halts). But the standard FIX-PTP gateway sends full refreshes, at most one message per 500 ms per symbol ([D2], [D10]).
   - **Confirmed:** A3 says internet access "no se considera confiable en condiciones de alta volatilidad" ([D10]).
   - **Inferred:** the bot has to work out staleness itself, from when it received each quote, the session calendar, and a REST snapshot after every reconnect.
8. **Freshness rules must know the trading schedule.** AGRO futures trade 10:30–17:00, with pre-opening 10:00–10:30, post-trading 17:00–17:30, CPX 17:15–17:25, and the *precio de ajuste* at 17:00. There is a summer schedule of 11:00–17:00 (Nov–Mar), and Chicago-referenced contracts trade 10:30–15:20. Holidays come from the FyO calendar and from circulares. **Confirmed** ([A4], [D13], [D14], [D17])
9. **Symbols need a mapping layer.** Trading tickers come in several forms:
   - `SOJ.ROS/MAY26`: USD futures, 100 t, Rosario
   - `SOJ.ROS/MAY26M`: mayorista
   - `SOJ.ROS/MAY22 300 C`: option
   - `SOJ.MIN/…`: mini
   - `SOY.CME/…`: Chicago-referenced

   These differ from the clearing symbols used in Post Trade. Post Trade `SecurityList` with `securityIDSource=H&marketID=ACSA` provides the mapping. Product rules change by circular; for example, Soja VISEC can only be traded as a spread from 26/10/2026. **Confirmed** ([D13], [P1], [D15])
10. **There is no maintained official SDK.** The docs are current: REST/WS v1.21 (Apr 2025), Post Trade v1.64 (Apr 2026), Índices V11 (Sep 2026). The official clients are old:
    - pyRofex's last release is 0.5.0, from 2023-11-12.
    - jsRofex was last pushed on 2023-03-15.
    - There is no TypeScript client.
    - pyRofex does not reconnect automatically.

    **Confirmed** ([G2], [G3]). **Inferred:** plan on writing our own thin client.

---

## 1a. Test environment for the demo: reMarkets

reMarkets is Primary's public sandbox for the Trading API (REST, WebSocket, FIX) and the Risk API. It is the only A3 environment you can sign up for yourself ([D10], [P1]). I checked it on Saturday 2026-10-24 at 15:08 UTC (12:08 in Argentina, with the market closed). I did not create an account or send credentials.

**1. Credentials: self-service with a Google account, free, issued immediately.** **Confirmed.** I did not test the sign-up.

- Sign in with a Google (Gmail) account at `https://remarkets.primary.ventures/`. The FAQ says: "Una vez logueado, las credenciales se generarán automáticamente y las encontrarás en la sección de Mi Cuenta > Datos Usuario" ([P8]). The account page shows the user, password, and account number, plus the endpoints for REST/WS, FIX, e-Trader, and Matriz ([P13]).
- The account is a comitente account with ARS 10M of fictitious money ([P6]). A3 describes the same flow: the applicant "se cree automáticamente una cuenta y reciba las coordenadas… y credenciales (usuario, clave y cuenta)" ([D10]).
- Cost: "No. El acceso y uso de las APIs en reMarkets no tienen costo" ([P8]).
- If a test needs a specific position, Primary loads it on request to remarkets@primary.com.ar ([P8]).

**2. Base URLs.** **Confirmed.** The WebSocket URL comes from official code, not from the spec.

| Interface | URL | Source |
|---|---|---|
| Portal and sign-up | `https://remarkets.primary.ventures/` | [P8] |
| REST | `https://api.remarkets.primary.com.ar`. Token: `POST /auth/getToken` with `X-Username` and `X-Password` headers; the `X-Auth-Token` response header is valid for 24 h | [D1], [P13] |
| WebSocket | `wss://api.remarkets.primary.com.ar/`, with `X-Auth-Token` sent as a handshake header | [G2] |
| FIX | `fix.remarkets.primary.com.ar:9876` | [D10], [P13] |
| Browser WebSocket test client | `https://api.remarkets.primary.com.ar/marketdata.html` (requires login) | [D1] |

**3. Reachability: up today. Whether prices move outside market hours: Unknown.**

- **Confirmed** by my check: the portal returned 200, and its maintenance check (`/checkMantenimiento?ruta=landing`) returned `"enMantenimiento":false`. Unauthenticated requests to the REST API (`/rest/segment/all`), a WebSocket upgrade, and `marketdata.html` each returned a 302 to `/login.html`. So the API is up and requires authentication.
- **Confirmed:** Primary says the common Trading and Risk API scenarios can be tested "24x7" ([P1]).
- **Confirmed:** A3 says the test instance "simula condiciones del mercado real, incluyendo contratos listados y liquidez replicada" ([D10]). reMarkets advertises "información del mercado en tiempo real" ([P8]).
- **Unknown:** whether quotes change on weekends or outside trading hours. No source says.
- **Inferred:** liquidity is replicated from the real market. So on weekends, and outside the 10:00–17:30 agro session, expect a static book showing the last session. It would change only when reMarkets users, including you, send orders.

**4. Grain instruments: Matba Rofex futures and options, with soja and trigo in the docs' examples.** **Confirmed.** What is listed today: **Unknown**.

- The FAQ says: "La MarketData disponible en reMarkets es la de los contratos de futuros y opciones de Matba Rofex" ([P8]).
- The spec's examples all run against `api.remarkets.primary.com.ar` ([P5]). They include:
  - segment `DDA` (agro) in `/rest/segment/all`
  - the option `TRI.ROS/DIC23 352 C`, in segment DDA
  - the futures `TRI.ROS/DIC23`, `SOJ.ROS/DIC22`, and `SOJ.QQ/ENE23`
  - a WebSocket subscription to `SOJ.ROS/MAY23`
  - a position in `SOJ.ROS/MAY23 380 C`
- These examples date from 2022–23. I found no `MAI.ROS` example.
- The FAQ says the protocol is the same as production, "pero podría haber diferencias de parametrización" ([P8]).
- To check after login: `GET /rest/instruments/bySegment?MarketSegmentID=DDA&MarketID=ROFX`.

**5. REST snapshots: yes. Rate limits: recommendations only.**

- **Confirmed:** snapshots via `GET /rest/marketdata/get?marketId=ROFX&symbol=…&entries=BI,OF,LA,OP,CL,SE,OI&depth=…` ([D1]).
- **Confirmed:** trade history via `GET /rest/data/getTrades`; in reMarkets, add `environment=REMARKETS` ([D1]).
- **Confirmed** as recommendations that are not specific to reMarkets ([P2]):
  - get a token once per day, and the instrument lists once per day;
  - call `marketdata/get` at most once per second, and `getTrades` once per 30 s;
  - open one WebSocket connection per day, with up to 1000 instruments per subscription, and ping every 30 s.
- **Unknown:** what reMarkets actually enforces.

### Demo notes

All **Inferred** unless marked otherwise.

- **Plan for a static market.** With the market closed, a REST snapshot should return the last session's `LA`, `SE`, `CL`, and `OI`.
  - To show alerts firing, put a replay or mock feed behind the same interface as the WebSocket client. Have it emit `Md`-shaped messages seeded from real reMarkets snapshots.
  - Small limit orders from the reMarkets account should change `BI`/`OF` and exercise the real WebSocket path end to end. reMarkets money is fictitious, but keep order entry out of the production bot.
- **Run the WebSocket client on a server.** Browsers can't set an `X-Auth-Token` header on a WebSocket handshake. REST calls from the browser may work: the unauthenticated response echoed my test `Origin`, allowed credentials, and exposed `X-Auth-Token`. Observed, but not tested with a token.
- **pyRofex pins old dependencies.** Its README says it only works with `websocket-client` 0.54.0–0.57.0 and Python 3.7–3.8 ([G2]). **Confirmed.** A thin client of our own may be quicker.
- **Sign-up risk.** The sign-up page uses Google's older Sign-In library (`apis.google.com/js/platform.js`, `gapi.auth2`) ([P13]). Google deprecated it on 31/3/2023 and hasn't set a shutdown date ([O1]). **Confirmed.** If sign-in fails, write to remarkets@primary.com.ar ([P8]). The Manual de Conectividad gives support hours of 9–18 h ([D10]), so don't count on help during a weekend.
- **Outages happen.** In April 2023, users on the pyRofex tracker reported that the reMarkets WebSocket failed and that `getTrades` returned "Internal Error". A repo contributor replied: "tuvimos un mal funcionamiento de la API websocket" ([G5]). **Confirmed.** Keep the mock feed as a fallback.
- **Don't present reMarkets quotes as real market data.** It is a test environment, and nothing I found covers showing its quotes outside testing ([§4.4](#44-distribution-and-redistribution-policy)).

---

## 2. Inventory of APIs and products (Q1)

Source of the list: the A3 APIs page and its interactive API map ([A1]), plus Primary's API hub, which the page links to as "Ver todas las APIs en Primary" ([P1]).

### 2.1 APIs

| API / product | Purpose | Protocol | Environments | Auth | Official docs | Status |
|---|---|---|---|---|---|---|
| **API Trading A3 — REST/WebSocket** ("Primary API", PTP) | Real-time and historical market data (trades), reference data (segments, instruments), order routing, execution reports; also `/rest/risk/...` endpoints | REST (JSON over HTTPS) and WebSocket. Per the docs, it translates FIX into web services | reMarkets: `https://api.remarkets.primary.com.ar`. Production: `api.primary.com.ar:443`, the same endpoint for the primary and DR sites | `POST /auth/getToken` with `X-Username`/`X-Password` headers returns an `X-Auth-Token` header, valid for 24 h | "API Trading A3 (REST/WS)" v1.21, 01/04/2025 ([D1]); same spec at [P5]; APIDoc ([P7]); Postman ([P10]) | **Confirmed** ([D1], [D10]) |
| **API Trading A3 — FIX** (FIX-PTP, FIX-PTP-HR gateways) | Same functions, for OMSs, terminals, and algos | FIX 5.0 SP2 over FIXT 1.1. SSL is required | Test: `fix.remarkets.primary.com.ar:9876`. Production: `fixgw.ptp.primary.com.ar:9876` | FIX Logon with comp IDs that Primary assigns. Certification required, valid for 1 year | ROE FIX-PTP / FIX-PTP-HR v2.0.53, Jul 2025 ([D2]) | **Confirmed** ([D2], [D10], [P1]) |
| **API FIX Low Latency** (FIX-PTP-LL) | Incremental market data, depth 100 | FIX 5.0 SP2 | Colocation only | FIX Logon | ROE FIX LL, Nov 2024 ([D3]) | **Confirmed** ([D3], [D10]) |
| **API REST – Registración** (trading side) | "Registro de operaciones en el mercado": registers trades agreed outside the order book | REST | Not stated | Not stated | Atlassian space ([P11]) | Listed on [A1]. Scope and agro coverage: **Unknown** |
| **API Post Trade A3** ("API BO", Anywhere Portfolio) | Argentina Clearing data: participants, accounts, positions, trades, guarantees, accounting, contract parameters, end-of-day `MarketData`, physical-delivery workflow | REST ("9 dominios" on the map) | Demo: `https://demoapi.anywhereportfolio.com.ar`. Production: `api.anywhereportfolio.com.ar` | `POST /AuthToken/AuthToken` with `nombreUsuario` and `password` returns a token valid for 24 h. Access is by role: ALyC/CED, AN CEL, Comitente, Público | "PrimaryAPI-BO" v1.64, 27/4/2026 ([D4]); buenas prácticas ([P3]); Postman ([P10]) | **Confirmed** ([D4], [A1]) |
| **API Post Trade – Registración** | Registration of securities trades (MarketID XMAB; types Bilateral, Bilateral vía Corredor, Garantizado, Derivaciones) | REST | Testing through lanzamiento-registracion@a3mercados.com.ar | Not checked | v1.69, 7/9/2026 ([D5]) | **Confirmed.** Covers securities, not grain contracts |
| **API Risk** (Primary RIMA) | "Consulta + Impacto en tiempo real de posiciones… saldos… garantías" per account; imports of positions, balances, and guarantees | REST | reMarkets (testable 24x7) and production | HTTP Basic. Roles: `RIMA_ADMINISTRATOR`, `RIMA_BROKER`, `PRE_TRADE_RISK` | Primary Risk API ([P4]) | **Confirmed** on Primary's hub ([P1]). Not in A3's own doc list |
| **API de Índices** ("API Índices MtR") | A3 indices, including the grain indices | REST and WebSocket | One environment: `https://api.matbarofex.com.ar/v2/` | Register at `/v2/register`; approval arrives by email. `POST /v2/token/` returns a Bearer access token (24 h) and a refresh token (7 days, via `/v2/token/refresh/`) | V10.2026.03.20 ([D6]); V11.2026.09.25 ([D7]); buenas prácticas ([D8]) | **Confirmed** |
| **API Mercado Primario** | Primary-market placements and licitaciones (bonds) | REST (OpenAPI `placements-api.yaml`) | Postman collection ([P10]) | OAuth2 `client_credentials`; token valid for 24 h | v1.0, 18/08/2026 ([D9]) | **Confirmed.** Not relevant to grains |

Primary's status widget also lists "API PrimaryID" and "API Reference Data" ([P1]). Neither is documented for A3 consumers. **Unknown**

### 2.2 Other access channels and consumers on the APIs map

All of the following are **Confirmed** from [A1] unless another source is cited.

- **e-Trader**: a Java Web Start trading terminal. Production: `https://etrader.ptp.primary.com.ar/etrader3.jnlp`. Test: `https://etrader.remarkets.primary.com.ar/`. Manual: [P12].
- **Terminales**: third-party terminals that connect over FIX or REST/WS.
- **Anywhere Portfolio**: a post-trade web platform at `https://anywhereportfolio.com.ar/`, with a demo. Users are enabled at the request of the Agent ([D18]).
- **WINK**: Argentina Clearing's platform for physical delivery of soja, trigo, and maíz ([A8]). No public API documentation. **Unknown**
- **Clear (MAE Clear)**, **Middle Office**, and **BackOffice**: listed as consumers of Post Trade.
- **Supporting material:**
  - Manual de Conectividad A3 ([D10])
  - TRD and BO buenas prácticas ([P2], [P3])
  - Postman collections ([P10])
  - a WebSocket test client at `https://api.remarkets.primary.com.ar/marketdata.html` ([D1])
  - a status page ([P9])
  - integration support at mpi@primary.com.ar ([A1])

### 2.3 Public data products (not APIs)

| Product | What it is | Source |
|---|---|---|
| Market Data portal (`https://marketdata.mae.com.ar/`, agro view at `/home-agro`) and Boletín Diario (`/boletindiario`) | Web portal | [A4], [A10] |
| Visor de precios (`https://visordeprecios.a3mercados.com.ar/`) | "Evolución de segmentos en tiempo real durante horarios de negociación" | [A4] |
| A3 Live (`https://a3live.ar/`) | "Plataforma de datos de mercado en tiempo real… productos financieros y agropecuarios" | [A10] |
| CEM | Listed on Datos de mercado | [A4] |
| Email subscriptions | Includes "Precios de cierre – Cierre del Día A3 Mercados" | [A9] |
| Índice Soja Matba historical CSV | `/indices/historico-indice-soja-a3-er.csv`, linked from the index page | [A6] |

Reuse terms for these products: none found. The site footer says the information "tiene carácter informativo" ([A9]). **Unknown.**

The A3 site's own JavaScript calls internal endpoints such as `/api/market-data/indices` ([A1]). They are undocumented, so don't build on them. **Inferred.**

---

## 3. Market data for grains (Q2)

### 3.1 Instruments

All **Confirmed**, from the Guía FyO Agro ([D13]) and the Soja product page ([A5]) unless another source is cited.

- **USD futures with physical delivery, 100 t:** Soja, Trigo, Maíz, Girasol, Sorgo, Cebada. Ticker examples: `SOJ.ROS/MAY22`, `MAI.ROS/…`, `TRI.ROS/…`. `ROS` means puerto de Rosario; other delivery destinations are set by circular. Tick is USD 0.10. Payments are made in pesos at the "Dólar MtR" rate.
- **Mayorista contracts** end in `M`, e.g. `SOJ.ROS/MAY26M` ([P1]).
- **Peso futures, 30 t:** the series include "Entrega Inmediata", i.e. disponible.
- **Base futures** against Rosario, e.g. `SOJ.CHA.BS`, `MAI.IW.BS`, `TRI.TDL.BS`.
- **Aceite de Soja**, 30 t.
- **Minis**, 10 t (`SOJ.MIN/…`), cash-settled against the USD futures' *precio de ajuste*.
- **Chicago-referenced contracts**, 5 t (`SOY.CME/…`, `CRN.CME/…`), settled against CBOT.
- **American options on the USD futures**, e.g. `SOJ.ROS/MAY22 300 C`.
- **`SOJ.EXP/…`**: invoiced at the Dólar Exportación rate.
- **Soja VISEC** (EU Regulation 2023/1115): from 26/10/2026 it trades only as a spread (*pase*), `SOJ.ROS.VISEC/[MES][AA]/[MES][AA]` ([D15]).
- **Disponibles:**
  - Post Trade `SecurityList` includes `SOJ.ROS.P/DISPO` ("SOJ Pesos MATba") and `TRI.BA/DISPO` ("TRI Disponible") ([D4]).
  - The fee schedule lists "Contratos Disponibles" ([D11]).
  - From 6/4/2026 participant identity is hidden in AGRO futures and options but still shown for Disponibles ([D16]).
  - **Unknown:** whether Disponible instruments stream over the Trading API WebSocket. Check on reMarkets with `/rest/instruments/details`.
- **Indices** ([D6], [D7], [A7]):
  - **I.SOJA, I.MAIZ, I.TRIGO** (*Índices Continuos*): a time-weighted average of specified USD futures positions within 12 months.
  - **SOJ.A3** (*Índice Soja Matba*, added in V11): includes a `vectorA3` array of `{posicion, toneladas, precio}`, e.g. `posicion` = `SOJ.ROS/MAY27`, `precio` = *precio de ajuste* in USD/t.
  - I.DOLAREXPO and I.AGTKSOYA/CORA/WHEA were discontinued on 15/05/2025.
- **Trading API segment for agro:** DDA ("División Derivados Agropecuarios"), with `marketId=ROFX` ([D1], [P5]).
- **Instrument metadata** from `/rest/instruments/details`: `lowLimitPrice`, `highLimitPrice`, `minPriceIncrement`, `contractMultiplier`, `maturityDate`, `currency`, `priceConvertionFactor`, `tickPriceRanges`, and `cficode`. CFI examples: `FXXXSX` for futures, `OCAFXS`/`OPAFXS` for options on futures ([D1]).

### 3.2 Fields by channel

All **Confirmed** from [D1], [D2], [D4], [D6], and [D7].

| Concept | Trading API REST/WS entry | FIX `MDEntryType` | Post Trade `MarketData` `MDEntryType` | Índices API |
|---|---|---|---|---|
| Bid / offer (book depth 1–5) | `BI` / `OF` (arrays of `price`, `size`) | `0` / `1` (MarketDepth up to 5) | — | — |
| Last trade | `LA` (`price`, `size`, `date`) | `2`; `TradeCondition` `U` = "Exchange Last", i.e. the last trade even if it is old | `2` TickByTick | — |
| Open | `OP` | `4` | — | — |
| Close of the previous session | `CL` | `5` | `5` Closing prices; also FX references such as "Dólar MtR" and "Dólar Ref. CA3500" | `closeIndexValue`, `closeIndexDate` |
| **Precio de ajuste** (settlement; futures only) | `SE` | `6` | `6` Settlement Price, e.g. `MAI.ROS/MAR24` 174 USD, `MDEntryTime` 18:00:00 | SOJ.A3 `vectorA3[].precio` |
| Session high / low | `HI` / `LO` | `7` / `8` | — | — |
| Volume | `TV`. `EV`/`NV` apply only to ByMA instruments ([P5]) | `B` | `B` Trade Volume | — |
| Open interest | `OI` (futures) | `C` | `C` Open Interest | — |
| Index value | `IV` | `3` | `3` Index | `indexValue` |
| Current day's closing price | `ACP` | — | — | — |
| CPX / auction / reference price | — | `u` / `Q` / `W` | — | — |
| Timestamps | REST `LA`, `SE`, `OI`, `CL` carry `date` in epoch ms. The WS `Md` example shows none. `getTrades` returns `servertime` (epoch ms) and `datetime` | `MDEntryDate` / `MDEntryTime`, UTC with milliseconds | `ClearingBusinessDate` plus `MDEntryTime` | `mdEntryDateTime` (UTC), `unixTimestamp`, and `representativeness` (`R`/`NR`) |

### 3.3 Timeliness and history

- **Real time:** Trading API WebSocket, or FIX. Primary's FAQ says real-time market data should come from the Trading API, over REST, WebSocket, or FIX ([P1]). REST returns a snapshot ([D1]). **Confirmed.**
- **Gateway conflation:** FIX-PTP sends a full refresh at depth 10, at most one message per 500 ms per symbol. FIX-PTP-HR sends one per 50 ms. FIX-PTP-LL is incremental and available only with colocation ([D10]). **Confirmed.** Whether REST/WS updates are conflated the same way: **Unknown**.
- **Historical:** `/rest/data/getTrades?marketId=ROFX&symbol=…&date=…`, or with `dateFrom`/`dateTo`, returns trades only. In test, add `environment=REMARKETS` ([D1]). Recommended frequency is 1 request per 30 s, because the data "updates every 30 s" ([P2]). **Confirmed.**
  - I found no historical OHLC or settlement endpoint in the Trading API. **Inferred** from its absence in [D1].
  - Settlement history is available from Post Trade `MarketData` by `ClearingBusinessDate` ([D4]) and from the Índice Soja CSV ([A6]).
- **Indices:** the service runs 24x365 except during maintenance. Indices built on derivatives have values only during trading hours ([D6]). Continuous indices are refreshed every minute ([D8]). **Confirmed.**
- **Delayed feed:** none documented. **Unknown.**

### 3.4 Subscription mechanics and limits

**Trading API: authentication and connection**

- `POST /auth/getToken` returns an `X-Auth-Token` header valid for 24 h ([D1]). Request a token once per day ([P2]). **Confirmed.**
- The spec PDF doesn't give the WebSocket URL. The official client pyRofex uses `wss://api.remarkets.primary.com.ar/` (test) and `wss://api.primary.com.ar/` (live), sending `X-Auth-Token` as a header on the WebSocket handshake ([G2]). **Confirmed** in official code, not in the spec.

**Trading API: subscribe.** The client sends a message like this (example from [D1]). **Confirmed.**

```json
{"type":"smd","level":1,"entries":["OF"],
 "products":[{"symbol":"DLR/DIC23","marketId":"ROFX"},
             {"symbol":"SOJ.ROS/MAY23","marketId":"ROFX"}],
 "depth":2}
```

**Trading API: server messages.** The server "enviará un mensaje de MD por cada instrumento al que nos suscribimos cada vez que este cambie" ([D1]). **Confirmed.**

```json
{"type":"Md","instrumentId":{"marketId":"ROFX","symbol":"DLR/DIC23"},
 "marketData":{"OF":[{"price":189,"size":21},{"price":188,"size":13}]}}
```

**Unknown:** whether each `Md` message carries the full state of the subscribed entries or only the entries that changed.

**Trading API: REST snapshot.** `GET /rest/marketdata/get?marketId=ROFX&symbol=<ticker>&entries=BI,OF,LA,OP,CL,SE,OI&depth=<n>` ([D1]). **Confirmed.**

**Trading API: response examples.** From the spec's reMarkets examples ([P5]), reformatted. **Confirmed.**

`marketdata/get` (here for `DLR/DIC23`, `depth=3`). `LA`, `SE`, `CL` and `OI` are objects whose `date` is epoch milliseconds, `OP` is a bare number, and `BI`/`OF` are arrays, best price first:

```json
{"status":"OK",
 "marketData":{
   "LA":{"price":179.85,"size":4,"date":1669995044232},
   "SE":{"price":180.3,"size":null,"date":1669852800000},
   "CL":{"price":180.35,"size":null,"date":1669852800000},
   "OI":{"price":null,"size":217596,"date":1664150400000},
   "OP":180.35,
   "BI":[{"price":179.75,"size":275},{"price":178.95,"size":514}],
   "OF":[{"price":179.8,"size":1000},{"price":180.35,"size":1000}]},
 "depth":2,"aggregated":true}
```

`GET /rest/instruments/details` takes no parameters and returns every instrument. The top-level `symbol` is `null`; the ticker is in `instrumentId.symbol`. One entry, trimmed:

```json
{"status":"OK",
 "instruments":[
   {"symbol":null,
    "segment":{"marketSegmentId":"DDA","marketId":"ROFX"},
    "lowLimitPrice":0.1,"highLimitPrice":100,"minPriceIncrement":0.1,
    "contractMultiplier":100,"maturityDate":"20231123","currency":"USD",
    "securityDescription":"TRI.ROS/DIC23 352 C","cficode":"OCAFXS",
    "instrumentId":{"marketId":"ROFX","symbol":"TRI.ROS/DIC23 352 C"}}]}
```

`GET /rest/instruments/bySegment?MarketSegmentID=DDA&MarketID=ROFX` returns only `{"status":"OK","instruments":[{"marketId":"ROFX","symbol":"..."}]}`. Errors come back as `{"status":"ERROR","description":"No tiene acceso a la cuenta 30","message":null}`. **Unknown:** what an entry looks like when it has no data, for example `LA` before the first trade of a contract; treat it as possibly missing or `null`.

**Trading API: recommended consumption** ([P2]). **Confirmed** as recommendations; the limits actually enforced, and the penalties, are **Unknown**.

| Call | Recommendation |
|---|---|
| `getToken` | Once per day |
| Segment and instrument lists | Once per day |
| `marketdata/get` | At most 1 request per second, for closing information; use WebSocket for real time |
| `data/getTrades` | 1 request per 30 s |
| WebSocket | One connection per day; up to 1000 instruments per subscription message; send a ping every 30 s |

**API de Índices.** All **Confirmed** ([D6], [D7], [D8]).

- REST: `GET https://api.matbarofex.com.ar/v2/symbol/{I.SOJA|I.MAIZ|I.TRIGO|SOJ.A3|…}`.
- WebSocket: `wss://api.matbarofex.com.ar/v2/live/symbol/`, with an `Authorization` header. Subscribe message: `{"action":"subscribe","request_id":1,"symbols":[…]}`.
- Permissions are granted per symbol. If any symbol in a subscription is not authorized, the whole subscription is rejected with 403.
- Rate limits: 10 REST requests per second per source IP; 600 requests/min when authenticated, 120/min anonymous; HTTP 429 when exceeded.
- Recommended consumption: 1 REST request per minute (WebSocket preferred); at most 10 instruments per subscription message; one WebSocket connection per day.

**Post Trade `MarketData`.** All **Confirmed** ([D4], [P3]).

- Request: `GET /PosTrade/MarketData?MDEntryType=6&ClearingBusinessDate=YYYYMMDD`. Agro instruments come back with `SegmentID` `AGRO`.
- Data is published after `ClosingProcesses` reports `ProcessTypeCode` 23 ("Publicación de Ajustes").
- Recommended: query twice per day. Throttle listed as "2/ segundos"; the notation is ambiguous.

---

## 4. Access, onboarding, fees, and licensing (Q3)

### 4.1 Who can get credentials

| Access | Who | How | Status |
|---|---|---|---|
| **reMarkets** (Trading and Risk sandbox) | Anyone | Self-service sign-up at `https://remarkets.primary.ventures/`. It creates a user and a comitente account with ARS 10M of fictitious money, with access to all Trading APIs plus e-Trader, Matriz, and Talaris. The homologation guide lists a Gmail account as a requirement. Free; credentials are generated at the first Google login. Money is fictitious, but A3 says contracts and liquidity are replicated from the real market. Details in [§1a](#1a-test-environment-for-the-demo-remarkets). **Inferred:** a test feed, not a source for real alerts | **Confirmed** ([P8], [P6], [P1], [D10]) |
| **Trading API, production** (REST/WS/FIX) | "Participantes autorizados" | Request through operaciones@a3mercados.com.ar; certification is required ([D10]). FIX certification goes through mpi@primary.com.ar and is valid for 1 year ([D2]). The pyRofex README says LIVE credentials come from the MPI team at mpi@primary.com.ar ([G2]) | **Confirmed.** Whether a non-member can get them directly: **Unknown** |
| **DMA through an agent** | Clients of CNV-registered agents | Aviso 530 defines DMA models: traditional, "proveedor directo", and "conexión directa". ISVs and agents distribute market data to their DMA users ([D12], [D10]) | **Confirmed** |
| **Market data vendors** | Vendors' customers | The Manual de Conectividad lists certified Market Data providers CMA, Refinitiv/LSEG, and Gallo ([D10]). The vendors page lists MarketData distributors Bloomberg, CMA, FastMarkets, Reuters/LSEG, The ICE, and Vantek ([A2]) | **Confirmed** list. Their redistribution terms: **Unknown** |
| **Post Trade, production** | Agents, plus comitentes for their own accounts | Credentials come from Argentina Clearing: atencionalcliente@matbarofex.com.ar per v1.64 ([D4]), or "A3 CCP" atencionalcliente@a3mercados.com.ar per the newer Registración doc ([D5]). Test credentials come from mpi@primary.com.ar ([D4]) or remarkets@primary.com.ar ([P1]). **Comitentes:** log in to MiPortafolio and open a ticket at `https://form.jotform.com/rofexacsa/autorizacion-APIBO-Comitente` listing the accounts; no ALyC signature is needed ([D4]) | **Confirmed.** How to get a "Público" user: **Unknown** |
| **API de Índices** | Anyone who registers | Form at `https://api.matbarofex.com.ar/v2/register`; approval arrives by email. Described as "privada y sin costo". Contact: investigacion@a3mercados.com.ar | **Confirmed** ([D6]) |
| **Market membership** | Entities registered with the regulator | Categories include ALyC Propio/Integral, AN, ACVN, Emisores, Bancos, and Casas de cambio. Contact: atencionalcliente@a3mercados.com.ar | **Confirmed** ([A3]). **Inferred:** not a realistic path for a software vendor |

### 4.2 Onboarding steps for the Trading API

1. Sign up on reMarkets and build against `api.remarkets.primary.com.ar` or `fix.remarkets.primary.com.ar:9876` ([P8], [D10]). **Confirmed.**
2. Certify with A3 (operaciones@) or Primary MPI (mpi@). The FIX certification form is at `https://forms.a3mercados.com.ar/242756041252047` ([A1], [D2], [D10]). **Confirmed.**
3. Certification leads to production credentials ([D10]). **Confirmed.** Mandatory risk controls such as Cancel On Disconnect and Kill Switch apply to order flow ([D10]). **Inferred:** they don't apply to a read-only consumer.
4. Choose connectivity: internet, dedicated lines, or colocation. The primary data center is Iplan Buenos Aires, DR is Iplan Rosario, and the test instance runs on Huawei Cloud. Support hours are 9–18 h ([D10]). **Confirmed.**

### 4.3 Fees

- "Arancel por Difusión y Distribución de Información de Mercado: **NO ARANCELADO**" and "Arancel por Acceso Directo al Mercado: **NO ARANCELADO**" (Derecho de Registro y Aranceles, 20.03.2026). The fees in that document are provisional, pending CNV maximums ([D11]). **Confirmed.**
- "Actualmente A3 Mercados publica información de mercado… del segmento Derivados de forma gratuita y en tiempo real…". The manual adds that historical data, advanced analytics, or other segments "podría estar sujeta a cargos o restricciones" in the future ([D10]). **Confirmed.**
- The API de Índices is free ([D6]). **Confirmed.**
- Monthly membership fees, USD before IVA: Membresía 2 (secundario) — ALyC 1000, AN 200, ACVN 1000, Bancos 1000; Membresía 3 — Bancos 2500, Casas de cambio 200 ([A3]). **Confirmed.**
- Connectivity costs (lines, colocation), and any Primary or vendor fee for API users or terminals: **Unknown**.

### 4.4 Distribution and redistribution policy

- **CNV rules** (Normas, Título VI, Cap. I, Sección XXV) ([R1]). **Confirmed.**
  - **Art. 58:** markets must disseminate real-time market data "sin retraso artificial y sin costo… para uso exclusivo por parte de sus Agentes miembros".
  - **Art. 59**, as amended by RG 1044/2024: other participants get access through agreements, for (i) redistribution by agents to their DMA clients, and (ii) use, distribution, and redistribution by other markets and their agents, including their clients. Fees must be published, non-discriminatory, capped by CNV, and posted on the AIF and the market's website.
  - RG 1044/2024's recitals tie third-party use and distribution to agreements with markets ([R2]).
- **Aviso 530:** data delivered to DMA users "podrá estar sujeta a los cargos que estos dispongan -según los máximos determinados por la CNV-… establecidos por Circular" ([D12]). **Confirmed.**
- **Not public.** **Unknown:** I searched the A3 site, its docs, and its circulares and found none of the following:
  - an A3 market data policy or license agreement
  - definitions of display vs non-display use, or professional vs non-professional users
  - a delayed-data exemption
  - per-user or per-device fees
  - rules for derived data, such as alerts computed from quotes
  - rules for a SaaS that shows data to employees of many companies
- **Implications.** **Inferred** from [R1] and [D12]. A non-member SaaS vendor is not an *Agente miembro* under Art. 58, and it doesn't clearly fit Art. 59 (i) or (ii). Plausible routes:
  - (a) a direct data agreement with A3;
  - (b) a licensed vendor whose license allows redistribution to our tenants;
  - (c) tenants that are A3 agents bring their own entitlement, with A3 confirming that a vendor-hosted app may display that data to the agent's own staff.

  A3 has to confirm which route applies.

---

## 5. Non-market-data APIs for a grain brokerage CRM (Q4)

### 5.1 Post Trade methods useful for tracking operations

All **Confirmed** from [D4]. Timing comes from the BO buenas prácticas ([P3]).

| Method | What it returns | When it is ready / recommended polling | Roles that may call it |
|---|---|---|---|
| `TradeCaptureReport` (GET) | All trades of the user's accounts for a date range (agro `MarketID` XMTB). `TrdRptStatus`: 0 Definitiva, 3 Anulada, 4 Transitoria. POST registers OTC trades, e.g. NDF OTC | Transitorias and Anuladas: up to 12/min, "para poder obtenerlas de forma online". Definitivas: twice a day, after process 1 | Comitente, agents |
| `PositionReport` | End-of-day positions per account (`SettlPrice`, `DailySettlement`). With `viewPafg=true` it adds **PAF G** positions (e.g. `FixingPosition` `TRI.BA/JUL21`, `CounterpartAccount`, `DeliveredNotFixed`/`DeliveredFixed`) | After process 2 | Comitente, agents |
| `PositionMaintenance` | Cancelled operations | After process 1 | Comitente, agents |
| `DeliveryQuotaRegistration` | **Cupos** for delivery (`AllocID` carátula, `QuotaDate`, `DeliveryPoint`, `Product`, seller and buyer accounts) | — | Agents (role annex in [D4]) |
| `AllocationInstruction` | **Ofertas de entrega**, e.g. `MAI.ROS/OCT22` | — | Agents |
| `AllocationReport` | Grouped **carátulas** (`DeliveryType` Camiones, `DeliveryPoint`, `OfferType`, counterparties) | — | Agents |
| `SettlementStatusReport`, `ExecutionReport` (order book by date range) | Settlement status; orders | `ExecutionReport` at end of day | Agents |
| Margins and guarantees: `MarginRequirementReport`, `DeliveryMarginRequirementReport`, `MarginBalance`, `MT506`, `MT536`, `CollateralList` | Required margins and posted guarantees | Mostly after the clearing processes (e.g. process 22 for margins) | `CollateralList` is also available to Público and Comitente |
| `MT940`, `Invoices`, `Fee`, `AccruedFees` | Ledger, invoices, fees | End of day | `AccruedFees` is available to Comitente |
| `RegistrationInstructions` | Warrants and certificados de depósito | — | Agents |
| `PartyDetails`, `AccountDetails`, `DepositaryAccountList`, `SecurityList` | Participants, accounts, contracts (including `DISPO` and OTC instruments; trading-to-clearing symbol mapping) | Daily; `DepositaryAccountList` updates every 10 minutes | `PartyDetails` and `SecurityList` are also available to Público |
| `ClosingProcesses` | Completion time of each ACyRSA process (e.g. 2 = Cálculo de Márgenes y Diferencias, 23 = Publicación de Ajustes, 26 = Movimientos Cuenta Corriente Mercadería) | Poll once per minute after the close | Público, Comitente |

### 5.2 Can operations be read from A3 instead of spreadsheets?

- **Partly.** **Confirmed:** business registered at A3 is available for the accounts a credential is authorized for. That covers futures, options, disponibles, OTC trades registered at A3, physical delivery (cupos, ofertas, carátulas), and PAF G positions ([D4]).
- **Inferred:** a corredora's typical producer-to-buyer physical contracts (precio hecho, a fijar, canje) are not at A3 unless they are executed as A3 contracts. By law they are reported to **SIO-Granos** by RUCA-registered operators ([X3]). A3 can complement the operations record but cannot replace it.
- **Unknown:** whether A3 offers an API to register physical grain contracts (*registro de contratos*). None is listed on the APIs page.
  - The trading-side "API REST – Registración" registers operations agreed outside the order book. Whether it covers agro contracts: **Unknown** ([A1], [P11]).
  - Post Trade – Registración covers securities (MarketID XMAB) ([D5]).
- **API Risk** returns intraday positions, balances, and guarantees for agents' accounts, through RIMA roles ([P4], [P1]). **Confirmed.** It would only help tenants that are agents.
- **Credentials model.** **Inferred:** credentials belong to a participant, or to a comitente for specific accounts ([D4]). A multi-tenant SaaS would therefore store each tenant's own credentials and could only read what that tenant is entitled to.

---

## 6. Official SDKs, client libraries, and sample code (Q5)

Primary's FAQ points to `https://github.com/matbarofex` for connectors in .NET, R, Java, Python, and others ([P1]). Activity dates below come from the GitHub API on 2026-10-24 ([G1]).

| Repo | Language | Covers | Last activity | License | Assessment |
|---|---|---|---|---|---|
| `pyRofex` ([G2]) | Python | Trading REST and WS (market data, orders) | Last release 0.5.0 on 2023-11-12 (PyPI); last commit 2023-11-12; last push 2024-06-25; 7 open issues | MIT | **Inferred:** not actively maintained. **Confirmed** from its code: WS ping every 30 s, no automatic reconnect or resubscribe; `on_close` only logs ([G2]) |
| `jsRofex` ([G3]) | JavaScript (Node) | Trading REST and WS | Last push 2023-03-15. Its `package.json` names the package `rofexjs`; npm `rofexjs` is at 1.1.4, last modified 2022-05-16 | None declared | **Inferred:** stale; no TypeScript types found |
| `Primary.Net` ([G4]) | C# | Trading REST and WS | Last push 2023-11-08 | MIT | **Inferred:** stale |
| `rRofex` ([G4]) | R | Trading API | Last push 2023-05-09 | — | **Inferred:** stale |
| `phpRofex` ([G4]) | PHP | REST | Last push 2023-06-10 | — | **Inferred:** stale |
| `Paulinux-MarketAccessTest` ([G4]) | Java | REST market data (a fork) | Last push 2023-01-17 | — | **Inferred:** stale |
| `acyRsa` ([G4]) | R | ACyRSA BackOffice (Post Trade) API | Last push 2020-05-07 | — | **Inferred:** stale |

- **Unknown:** no official client found for the API de Índices, and none for Post Trade other than `acyRsa`.
- The newest repo in the org is `a3-ai-skill-cauciones` (2026-10-06). It covers cauciones, not grains ([G1]).
- **Other official aids:**
  - Postman collections for Trading REST, Trading WS, Post Trade, and Mercado Primario ([P10])
  - APIDoc ([P7])
  - the WebSocket web client ([D1])
  - Colab notebooks and webinars referenced in the docs ([D1], [D6])

---

## 7. Reliability details (Q6)

### 7.1 Trading hours and calendar

All **Confirmed** ([A4], [D13]).

| Products | Pre-opening | Trading | Post-trading | CPX | Precio de ajuste |
|---|---|---|---|---|---|
| Soja, Girasol, Trigo, Cebada, Maíz, Sorgo; Minis | 10:00–10:30 | 10:30–17:00 | 17:00–17:30 | 17:15–17:25 (executes at the precio de ajuste) | 17:00 |
| Soja and Maíz Chicago | — | 10:30–15:20 | — | — | 15:20 |

- The Guía FyO Agro gives a summer schedule (Nov–Mar) of 11:00–17:00, with Chicago contracts trading 11:00–16:20 ([D13]).
- The FIX session runs 9:30–19:00 (the generic schedule in [D2]).
- Holidays come from the Calendario FyO 2026 ([D14]) and ad-hoc circulares. Example: circular 1240-26 has no trading on 9–10 Nov 2026, and only FyO on 6 Nov ([D17]).

### 7.2 What each channel offers for detecting stale data and recovering

| Capability | Trading REST/WS | Trading FIX (PTP) | Post Trade | Índices |
|---|---|---|---|---|
| Heartbeat | Client sends a ping every 30 s ([P2]); pyRofex uses WebSocket ping frames every 30 s ([G2]) | `Heartbeat` with `HeartBtInt` ≥ 10 s, plus `TestRequest` ([D2]) | Not applicable (polling) | None documented |
| Sequence numbers / replay | None documented ([D1]) | `MsgSeqNum`; `ResendRequest` (`BeginSeqNo`/`EndSeqNo`, where 0 = infinity); `SequenceReset` gap fill; `PossDupFlag`/`OrigSendingTime` ([D2]) | Re-query by date | None documented |
| Snapshot after reconnect | REST `marketdata/get`, then WS resubscribe ([D1]) | `MarketDataRequest` (V), full refresh, `SubscriptionRequestType` 0/1/2 ([D2]) | Re-query | REST `/v2/symbol` |
| Per-quote timestamp | REST `LA`/`SE`/`OI`/`CL` `date` (epoch ms); none in the WS `Md` example ([D1]) | `MDEntryDate`/`MDEntryTime`, UTC with ms ([D2]) | `ClearingBusinessDate`, `MDEntryTime` ([D4]) | `mdEntryDateTime`, `unixTimestamp`, `representativeness` ([D6]) |
| Session / market status | None documented | `TradingSessionStatus` (h): `TradSesStatus` 0 Unknown, 1 Halted, 2 Open, 3 Closed, 7 Disabled; `TradingSessionSubID` 0 Pre-Trading, 1 Trading, 2 Post-Trading, 3 After Hour, 4 Closed, 8 CPX. `SecurityStatus` (f): 2 TRADING_HALT, 3 RESUME. `News` (B) per segment ([D2]) | `ClosingProcesses` ([D4]) | — |
| Instrument state | `instruments/details` (price limits) ([D1]) | `SecurityList` `SecurityStatus` 1 active, 2 inactive; `LowLimitPrice`/`HighLimitPrice` ([D2]) | `SecurityList` | — |
| Errors | Responses with status `ERROR` ([D1]) | `MarketDataRequestReject` (Y), with reasons including insufficient permissions ([D2]) | HTTP 429 ([P3]) | HTTP 403 / 429 ([D6]) |
| Throttling / conflation | **Unknown** | FIX-PTP: one message per 500 ms per symbol; HR: one per 50 ms ([D10]) | Throttled per method ([P3]) | Recalculated every minute ([D8]) |

### 7.3 Infrastructure

- REST/WS uses the same host, `api.primary.com.ar:443`, for both the primary (Iplan Buenos Aires) and DR (Iplan Rosario) sites ([D10]). **Confirmed.** How failover works, and what clients see during it: **Unknown**.
- Internet access "no se considera confiable en condiciones de alta volatilidad"; dedicated lines or colocation are recommended ([D10]). **Confirmed.**
- Status page: StatusCake ([P9]). Tokens expire after 24 h, so plan a daily re-login ([D1], [P2]). **Confirmed.**

### 7.4 Implications for the tracker bot

All **Inferred** from §3 and §7.

- **Alert only on quotes that pass every check:**
  - the session is open per A3's calendar, or the price is an `SE`/`CL` value for the expected date;
  - the instrument's last WebSocket update arrived within a threshold, or a fresh REST snapshot confirms it;
  - the connection's ping/pong is healthy;
  - the entry's `date`, when present, is today.
- **On reconnect:**
  1. Log in again if the token is close to 24 h old.
  2. Resubscribe.
  3. Take REST snapshots, prioritizing instruments with active triggers; the budget is about 1 request per second.
  4. Check `getTrades` (at most 1 request per 30 s) to see whether a trigger was touched while disconnected.
- **Keep price types separate:** `LA` (last trade, possibly old; FIX `TradeCondition` U), `SE` (settlement), and `BI`/`OF` (book).
- **Reconcile daily** against Post Trade `MarketData` settlement prices.

---

## 7a. Gaps: prices brokerages use that A3 does not provide (Q7, pointers only)

Not researched in depth.

- **Precio pizarra** from the Cámara Arbitral de Cereales (BCR): Rosario reference in $/t, "entrega enseguida, pago contado, puesto sobre camión y/o vagón en zona Rosario". Published daily ([X1]); also on BCR's *Cotizaciones Locales* page ([X2]).
- **Physical-market operations and prices** (precio hecho / a fijar, by zone): SIO-Granos public queries ([X3]).
- **Precios FOB oficiales and FAS teórico:** MAGyP ([X4]).
- **BCRA Comunicación A 3500 reference exchange rate:** BCRA ([X5]). Partial overlap: Post Trade `MarketData` includes a "Dólar Ref. CA3500" closing reference ([D4]).
- **CBOT/CME prices:** CME data, under a CME license ([X6]). A3's `SOY.CME`/`CRN.CME` are local contracts settled against CBOT ([D13]).
- **Pizarra prices from other ports and exchanges** (Bahía Blanca, Quequén, Córdoba): not researched. **Unknown.**

---

## 8. Open questions for A3 sales and support

1. **License for a non-member SaaS:** what agreement and fees apply to showing A3 grain quotes (real-time or delayed) to employees of several tenant companies? How do you define display vs non-display use, and does an alert engine count as derived data? Is the fee per user, per device, or per company?
2. **Delayed or end-of-day data:** is there a delayed or EOD feed exempt from fees, and what is the delay threshold?
3. **Market-data-only credentials:** can a non-member get production Trading API (REST/WS) credentials for market data only? What are the process, the certification requirements, and the cost from A3 and from Primary?
4. **Tenant credentials:** if a tenant is an A3 agent or comitente, may it authorize our hosted app to use its Trading or Post Trade credentials? Do we need to register as an ISV under Aviso 530?
5. **Público user:** how do we get a Post Trade "Público" user, at what cost, and what are the redistribution terms for EOD settlement prices?
6. **WebSocket behavior:** are `Md` messages full state or deltas? Are there timestamps, sequence numbers, server heartbeats, or session-status messages? What happens during failover to DR, and what rate limits are enforced?
7. **Conflation:** does the REST/WS gateway conflate updates the way FIX-PTP does (500 ms)?
8. **Disponibles:** do Disponible / Entrega Inmediata instruments have real-time market data on the Trading API?
9. **Other operations data:** is there any API for registering physical grain contracts, or for WINK delivery data?
10. **Public viewers and vendors:** what are the terms for Visor de precios, A3 Live, marketdata.mae.com.ar, and the index values? Which vendors may redistribute A3 agro real-time data to a third-party SaaS?
11. **reMarkets behavior:** do quotes change outside trading hours or on weekends? Is the book a real-time mirror of production, and do reMarkets users' orders trade against the replicated liquidity? Which agro instruments are listed today (including `MAI.ROS`), and what rate limits are enforced?

---

## 9. Sources

All accessed 2026-10-24.

**A3 site pages**

- [A1] APIs page and interactive API map (including the site's JS) — https://a3mercados.com.ar/tecnologia/apis
- [A2] Vendors — https://a3mercados.com.ar/tecnologia/vendors
- [A3] Cómo ser miembro — https://a3mercados.com.ar/agentes/como-ser-miembro
- [A4] Datos de mercado (hours, platforms) — https://a3mercados.com.ar/info-de-mercado/datos-de-mercado
- [A5] Soja product page — https://a3mercados.com.ar/productos/futuros-y-opciones/agropecuarios/soja
- [A6] Índice Soja Matba — https://a3mercados.com.ar/info-de-mercado/indices/soja-matba
- [A7] Índices continuos granos — https://a3mercados.com.ar/info-de-mercado/indices/continuos-granos
- [A8] Sistema WINK — https://a3mercados.com.ar/tecnologia/sistema-wink
- [A9] Suscripciones (and site footer) — https://a3mercados.com.ar/info-de-mercado/suscripciones
- [A10] Public viewers — https://visordeprecios.a3mercados.com.ar/ , https://a3live.ar/ , https://marketdata.mae.com.ar/home-agro

**A3 documents** (`/api/site-docs/`)

- [D1] API Trading A3 (REST/WS) v1.21 — https://a3mercados.com.ar/api/site-docs/api-trading-rest
- [D2] API Trading A3 FIX ROE v2.0.53 — https://a3mercados.com.ar/api/site-docs/api-trading-fix
- [D3] FIX Low Latency ROE — https://a3mercados.com.ar/api/site-docs/ptp-fusion-fix-50-sp2
- [D4] API Post Trade A3 (PrimaryAPI-BO v1.64) — https://a3mercados.com.ar/api/site-docs/api-post-trade
- [D5] API Post Trade – Registración v1.69 — https://a3mercados.com.ar/api/site-docs/api-post-trade-registracion
- [D6] Documentación API de Índices V10 — https://a3mercados.com.ar/api/site-docs/api-indices-mtr
- [D7] Documentación API de Índices V11 — https://a3mercados.com.ar/api/site-docs/api-indices-mtr-v11
- [D8] Manual de buenas prácticas API Matba Rofex — https://a3mercados.com.ar/api/site-docs/manual-buenas-practicas-api and V4: https://a3mercados.com.ar/api/site-docs/manual-buenas-practicas-api-matba-v2
- [D9] API Mercado Primario v1.0 — https://a3mercados.com.ar/api/site-docs/api-mercado-primario
- [D10] Manual de Conectividad A3 V11 — https://a3mercados.com.ar/api/site-docs/manual-conectividad-a3
- [D11] Derecho de Registro y Aranceles 20.03.2026 — https://a3mercados.com.ar/api/site-docs/derecho-registro-y-aranceles
- [D12] Aviso 530 (DMA) — https://a3mercados.com.ar/api/site-docs/aviso-530
- [D13] Guía FyO Agro — https://a3mercados.com.ar/api/site-docs/guia-fyo-agro
- [D14] Calendario FyO 2026 — https://a3mercados.com.ar/api/site-docs/calendario-fyo-2026
- [D15] Circular 1245 (Soja VISEC) — https://a3mercados.com.ar/api/site-docs/circular-nro-1245-operatoria-de-soja-visec-26
- [D16] Circular 1170 — https://a3mercados.com.ar/api/site-docs/circular-1170
- [D17] Circular 1240-26 — https://a3mercados.com.ar/api/site-docs/circular-1240-26
- [D18] Anywhere Portfolio T&C — https://a3mercados.com.ar/api/site-docs/anywhere-portfolio-tyc

**Primary**

- [P1] API Hub, including the FAQ and status list — https://apihub.primary.com.ar/
- [P2] TRD buenas prácticas — https://apihub.primary.com.ar/assets/docs/TRD-Buenas_practicas.pdf
- [P3] BO buenas prácticas — https://apihub.primary.com.ar/assets/docs/BO-Buenas_practicas.pdf
- [P4] Primary Risk API — https://apihub.primary.com.ar/assets/docs/PrimaryAPI-RISK.pdf
- [P5] Primary-API.pdf (the REST/WS spec referenced by [D10]) — https://apihub.primary.com.ar/assets/docs/Primary-API.pdf
- [P6] Homologation guide — https://apihub.primary.com.ar/assets/guias/guia_homologacion.html
- [P7] Trading APIDoc — https://apihub.primary.com.ar/assets/apidoc/trading/index.html
- [P8] reMarkets landing page and FAQ — https://remarkets.primary.ventures/
- [P9] Status page — https://uptime.statuscake.com/?TestID=xlRSRsRGR0
- [P10] Postman collections:
  - Trading REST — https://www.postman.com/mtr-pmy/primary/collection/s56nyis/primary-api-trading-rest
  - Trading WS — https://www.postman.com/mtr-pmy/primary/collection/617c4af964387758f2b032b0
  - Post Trade — https://www.postman.com/mtr-pmy/primary/collection/dysvadu/api-postrade-rest
  - Mercado Primario — https://www.postman.com/mtr-pmy/primary/collection/ijphlii/api-mercado-primario-rest
- [P11] API REST – Registración docs — https://pmy.atlassian.net/wiki/spaces/PTPAPI/overview?homepageId=4533813572
- [P12] e-Trader manual — https://pmy.atlassian.net/wiki/spaces/MDUE/overview
- [P13] reMarkets account page ("Mi Cuenta"; static HTML and scripts, fetched without logging in) — https://remarkets.primary.ventures/account.html

**Regulation and corporate**

- [R1] CNV Normas, Título VI, Cap. I — https://servicios.infoleg.gob.ar/infolegInternet/anexos/215000-219999/219405/texact-TituloVI-CapI.htm
- [R2] RG CNV 1044/2024 — https://www.argentina.gob.ar/normativa/nacional/norma-408123/texto
- [R3] MAE and Matba Rofex approve the merger (20/11/2024) — https://www.matbarofex.com.ar/documentos/prensa/20112024-mae-y-mtr-aprueban-la-fusion-a3
- [R4] CNV news on the A3 launch — https://www.argentina.gob.ar/noticias/presentacion-de-a3-un-nuevo-mercado-argentino-con-alcance-regional-y-nuevas-oportunidades-0
- [R5] CNV registry entry for A3 Mercados S.A. — https://www.cnv.gov.ar/SitioWeb/RegistrosPublicos/DetallesRegistrosPublicos/30460?tipoEntidadId=6

**Code**

- [G1] matbarofex GitHub org — https://github.com/matbarofex (dates via https://api.github.com/orgs/matbarofex/repos)
- [G2] pyRofex:
  - repo — https://github.com/matbarofex/pyRofex
  - PyPI — https://pypi.org/project/pyRofex/
  - `globals.py` — https://github.com/matbarofex/pyRofex/blob/master/src/pyRofex/components/globals.py
  - `websocket_rfx.py` — https://github.com/matbarofex/pyRofex/blob/master/src/pyRofex/clients/websocket_rfx.py
- [G3] jsRofex — https://github.com/matbarofex/jsRofex ; npm `rofexjs` — https://www.npmjs.com/package/rofexjs
- [G4] Other clients:
  - https://github.com/matbarofex/Primary.Net
  - https://github.com/matbarofex/rRofex
  - https://github.com/matbarofex/phpRofex
  - https://github.com/matbarofex/Paulinux-MarketAccessTest
  - https://github.com/matbarofex/acyRsa
- [G5] pyRofex issue #30, "Invalid WebSocket Header" (April–May 2023) — https://github.com/matbarofex/pyRofex/issues/30

**Gap pointers**

- [X1] CAC (BCR) Precios de Pizarra — http://www.cac.bcr.com.ar/es/precios-de-pizarra
- [X2] BCR Cotizaciones Locales — http://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0
- [X3] SIO-Granos:
  - https://www.siogranos.com.ar/
  - public queries — https://www.siogranos.com.ar/consulta_publica/operaciones_informadas.aspx
  - registration obligation — https://www.argentina.gob.ar/servicio/registrar-operaciones-de-compraventa-en-el-sistema-de-informacion-obligatoria-de-granos-sio
- [X4] MAGyP Precios FOB Oficiales — https://www.magyp.gob.ar/sitio/areas/ss_mercados_agropecuarios/fob_oficiales/ ; daily quotes — https://www.magyp.gob.ar/mercadosagropecuarios/precios.php
- [X5] BCRA A 3500 reference rate — https://www.bcra.gob.ar/tipo-cambio-referencia-comunicacion-a-3500-tcnpm/
- [X6] CME Group data licensing — https://www.cmegroup.com/market-data/license-data.html

**Other**

- [O1] Google Sign-In for Web, deprecation and sunset — https://developers.google.com/identity/sign-in/web/deprecation-and-sunset

[A1]: https://a3mercados.com.ar/tecnologia/apis
[A2]: https://a3mercados.com.ar/tecnologia/vendors
[A3]: https://a3mercados.com.ar/agentes/como-ser-miembro
[A4]: https://a3mercados.com.ar/info-de-mercado/datos-de-mercado
[A5]: https://a3mercados.com.ar/productos/futuros-y-opciones/agropecuarios/soja
[A6]: https://a3mercados.com.ar/info-de-mercado/indices/soja-matba
[A7]: https://a3mercados.com.ar/info-de-mercado/indices/continuos-granos
[A8]: https://a3mercados.com.ar/tecnologia/sistema-wink
[A9]: https://a3mercados.com.ar/info-de-mercado/suscripciones
[A10]: https://a3live.ar/
[D1]: https://a3mercados.com.ar/api/site-docs/api-trading-rest
[D2]: https://a3mercados.com.ar/api/site-docs/api-trading-fix
[D3]: https://a3mercados.com.ar/api/site-docs/ptp-fusion-fix-50-sp2
[D4]: https://a3mercados.com.ar/api/site-docs/api-post-trade
[D5]: https://a3mercados.com.ar/api/site-docs/api-post-trade-registracion
[D6]: https://a3mercados.com.ar/api/site-docs/api-indices-mtr
[D7]: https://a3mercados.com.ar/api/site-docs/api-indices-mtr-v11
[D8]: https://a3mercados.com.ar/api/site-docs/manual-buenas-practicas-api-matba-v2
[D9]: https://a3mercados.com.ar/api/site-docs/api-mercado-primario
[D10]: https://a3mercados.com.ar/api/site-docs/manual-conectividad-a3
[D11]: https://a3mercados.com.ar/api/site-docs/derecho-registro-y-aranceles
[D12]: https://a3mercados.com.ar/api/site-docs/aviso-530
[D13]: https://a3mercados.com.ar/api/site-docs/guia-fyo-agro
[D14]: https://a3mercados.com.ar/api/site-docs/calendario-fyo-2026
[D15]: https://a3mercados.com.ar/api/site-docs/circular-nro-1245-operatoria-de-soja-visec-26
[D16]: https://a3mercados.com.ar/api/site-docs/circular-1170
[D17]: https://a3mercados.com.ar/api/site-docs/circular-1240-26
[D18]: https://a3mercados.com.ar/api/site-docs/anywhere-portfolio-tyc
[P1]: https://apihub.primary.com.ar/
[P2]: https://apihub.primary.com.ar/assets/docs/TRD-Buenas_practicas.pdf
[P3]: https://apihub.primary.com.ar/assets/docs/BO-Buenas_practicas.pdf
[P4]: https://apihub.primary.com.ar/assets/docs/PrimaryAPI-RISK.pdf
[P5]: https://apihub.primary.com.ar/assets/docs/Primary-API.pdf
[P6]: https://apihub.primary.com.ar/assets/guias/guia_homologacion.html
[P7]: https://apihub.primary.com.ar/assets/apidoc/trading/index.html
[P8]: https://remarkets.primary.ventures/
[P9]: https://uptime.statuscake.com/?TestID=xlRSRsRGR0
[P10]: https://www.postman.com/mtr-pmy/primary/collection/s56nyis/primary-api-trading-rest
[P11]: https://pmy.atlassian.net/wiki/spaces/PTPAPI/overview?homepageId=4533813572
[P12]: https://pmy.atlassian.net/wiki/spaces/MDUE/overview
[P13]: https://remarkets.primary.ventures/account.html
[R1]: https://servicios.infoleg.gob.ar/infolegInternet/anexos/215000-219999/219405/texact-TituloVI-CapI.htm
[R2]: https://www.argentina.gob.ar/normativa/nacional/norma-408123/texto
[R3]: https://www.matbarofex.com.ar/documentos/prensa/20112024-mae-y-mtr-aprueban-la-fusion-a3
[R4]: https://www.argentina.gob.ar/noticias/presentacion-de-a3-un-nuevo-mercado-argentino-con-alcance-regional-y-nuevas-oportunidades-0
[R5]: https://www.cnv.gov.ar/SitioWeb/RegistrosPublicos/DetallesRegistrosPublicos/30460?tipoEntidadId=6
[G1]: https://github.com/matbarofex
[G2]: https://github.com/matbarofex/pyRofex
[G3]: https://github.com/matbarofex/jsRofex
[G4]: https://github.com/matbarofex/Primary.Net
[G5]: https://github.com/matbarofex/pyRofex/issues/30
[X1]: http://www.cac.bcr.com.ar/es/precios-de-pizarra
[X2]: http://www.bcr.com.ar/es/mercados/mercado-de-granos/cotizaciones/cotizaciones-locales-0
[X3]: https://www.siogranos.com.ar/
[X4]: https://www.magyp.gob.ar/sitio/areas/ss_mercados_agropecuarios/fob_oficiales/
[X5]: https://www.bcra.gob.ar/tipo-cambio-referencia-comunicacion-a-3500-tcnpm/
[X6]: https://www.cmegroup.com/market-data/license-data.html
[O1]: https://developers.google.com/identity/sign-in/web/deprecation-and-sunset
