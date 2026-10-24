# A3 Trading API: response formats

What A3's Trading API returns over REST and WebSocket, for the feed (`src/feed/`) and for anything that mocks it. The same API serves reMarkets (test) and production; only the host differs. Sources were accessed on 2026-10-24. Field names are as published.

Each finding is marked:

- **Confirmed**: shown in the API spec or in the official client's code.
- **Observed**: seen in real responses, either posted by users on the official client's issue tracker or checked directly.
- **Inferred**: my reading of the sources; not stated outright.
- **Unknown**: not found.

Access, licensing, trading hours and rate limits are covered in [a3-mercados-apis.md](a3-mercados-apis.md).

## Summary

1. Every REST response is a JSON object with `status` set to `"OK"` or `"ERROR"`, and the data under a key that depends on the method: `segments`, `instruments`, `instrument`, `marketData` or `trades`. **Confirmed** ([Spec]).
2. Log in with `POST /auth/getToken` and the `X-Username` and `X-Password` headers. The token comes back in the `X-Auth-Token` response header and lasts 24 hours. Send it in an `X-Auth-Token` header on every REST call and on the WebSocket handshake. **Confirmed** ([Spec], [pyRofex]).
3. `marketdata/get` returns exactly the entries you ask for. An entry with no data is `null`; `BI` and `OF` too, which never come back as empty arrays in these reports. **Observed** on reMarkets ([#34], [#35]).
4. `LA`, `SE`, `CL` and `OI` are `{price, size, date}` objects, with `date` in epoch milliseconds. `OP` is a bare number. `BI` and `OF` are arrays of `{price, size}`, best price first. **Confirmed** ([Spec]).
5. `LA.date` is the time of the last trade. The `SE`, `CL` and `OI` dates in the spec fall at exactly 00:00 UTC, so they mark a business day rather than a moment. **Inferred** from the example values.
6. Grain futures are priced in US dollars per tonne. **Inferred:** the Soja index gives each `SOJ.ROS` position's *precio de ajuste* in USD/t, and these contracts are 100 t ([main research §3.1](a3-mercados-apis.md#31-instruments)).
7. `instruments/details` sets the top-level `symbol` to `null`; the ticker is in `instrumentId.symbol`. The other instrument lists differ: `instruments/all` nests `instrumentId`, while `byCFICode` and `bySegment` return flat `{marketId, symbol}` pairs. **Confirmed** ([Spec]).
8. On the WebSocket you subscribe with `{"type":"smd",…}` and receive `{"type":"Md","instrumentId":…,"marketData":…}` messages. Errors arrive as `{"status":"ERROR",…}`. **Confirmed** ([Spec], [pyRofex]). Real `Md` messages also appear to carry a top-level `timestamp` in epoch milliseconds. **Observed** in 2020 on another deployment of the same platform ([#8]).
9. A3 republished the spec in April 2025 under its own name, with the same request and response examples. **Confirmed** ([A3 spec]).
10. reMarkets gets its prices from a bot that copies the live market, and the bot misses some instruments. **Observed:** a pyRofex maintainer said so in 2024 ([#35]). Together with item 3, this means a demo can't count on reMarkets returning a price. **Inferred**.

## Hosts and authentication

| | reMarkets | Production |
|---|---|---|
| REST | `https://api.remarkets.primary.com.ar` | `https://api.primary.com.ar` |
| WebSocket | `wss://api.remarkets.primary.com.ar/` | `wss://api.primary.com.ar/` |

**Confirmed** in the official client's configuration ([pyRofex] `globals.py`).

Login request:

```http
POST /auth/getToken
X-Username: <user>
X-Password: <password>
```

- The token is in the `X-Auth-Token` response header; the spec describes no response body. It lasts 24 hours. **Confirmed** ([Spec]).
- pyRofex treats any non-2xx login response as wrong credentials ([pyRofex] `rest_rfx.py`). The body of a failed login is **Unknown**.
- Send `X-Auth-Token: <token>` on every REST request. pyRofex logs in again when a request returns HTTP 401 ([pyRofex] `rest_rfx.py`). **Confirmed**.
- On reMarkets, requests without a token are redirected (302) to `/login.html`. **Observed** by the earlier check ([main research §1a](a3-mercados-apis.md#1a-test-environment-for-the-demo-remarkets)).

## Response envelope and errors

Success responses carry `"status":"OK"` plus the method's data. Errors carry `"status":"ERROR"` and text in `description`, `message` or both, with no fixed shape. The spec's examples ([Spec], *Anexo - Errores*):

```json
{"status":"ERROR","description":"Product DOEne15:ROFX doesn't exist","message":null}
{"status":"ERROR","description":"No tiene acceso a la cuenta 30","message":null}
{"status":"ERROR","message":"Access Denied"}
{"status":"ERROR","description":"Ruta invalida","message":""}
```

**Unknown:** which HTTP status comes with `"status":"ERROR"`. pyRofex parses the body whatever the status, except 401 ([pyRofex] `rest_rfx.py`).

## Segments

`GET /rest/segment/all`:

```json
{"status":"OK","segments":[
  {"marketSegmentId":"DDA","marketId":"ROFX"},
  {"marketSegmentId":"TEST","marketId":"ROFX"},
  {"marketSegmentId":"DUAL","marketId":"ROFX"},
  {"marketSegmentId":"MERV","marketId":"ROFX"}]}
```

- `DDA` is the agro division and `DDF` the financial one. `DUAL` holds instruments listed in both, and `MERV` instruments of external markets.
- The reMarkets example also lists a `TEST` segment.

**Confirmed** ([Spec]). The `bySegment` parameter also accepts `U-DDF`, `U-DDA` and `U-DUAL`, which the spec doesn't explain. **Unknown**.

## Instruments

| Request | Response |
|---|---|
| `GET /rest/instruments/all` | `{"status":"OK","instruments":[{"instrumentId":{"marketId":"ROFX","symbol":"TRI.ROS/DIC23 352 C"},"cficode":"OCAFXS"}]}` |
| `GET /rest/instruments/details` | `{"status":"OK","instruments":[<detail>, …]}`: every instrument, with all the fields below |
| `GET /rest/instruments/detail?symbol=DLR/NOV23&marketId=ROFX` | `{"status":"OK","instrument":<detail>}` |
| `GET /rest/instruments/byCFICode?CFICode=FXXXSX` | `{"status":"OK","instruments":[{"marketId":"ROFX","symbol":"SOJ.ROS/DIC22"}]}` |
| `GET /rest/instruments/bySegment?MarketSegmentID=DDA&MarketID=ROFX` | Same flat shape as `byCFICode` |

**Confirmed** ([Spec]; the paths are also in [pyRofex] `urls.py`). Primary's implementation guide loads `instruments/details` once and keeps it, because "el listado no suele cambiar durante el día" ([Guide]).

One `<detail>`, from the spec's example for a wheat option:

```json
{"symbol":null,
 "segment":{"marketSegmentId":"DDA","marketId":"ROFX"},
 "lowLimitPrice":0.1,"highLimitPrice":100,"minPriceIncrement":0.1,
 "minTradeVol":1,"maxTradeVol":20,"tickSize":1,
 "contractMultiplier":100,"roundLot":1,"priceConvertionFactor":1,
 "maturityDate":"20231123","currency":"USD",
 "orderTypes":["STOP_LIMIT","MARKET_TO_LIMIT","LIMIT"],
 "timesInForce":["FOK","IOC","DAY","GTD"],
 "securityType":null,"settlType":null,
 "instrumentPricePrecision":1,"instrumentSizePrecision":0,
 "securityId":null,"securityIdSource":null,
 "securityDescription":"TRI.ROS/DIC23 352 C",
 "tickPriceRanges":{"0":{"lowerLimit":0,"upperLimit":null,"tick":0.1}},
 "cficode":"OCAFXS",
 "instrumentId":{"marketId":"ROFX","symbol":"TRI.ROS/DIC23 352 C"}}
```

The fields that matter for prices, described as in the spec's field dictionary:

| Field | Type | Meaning |
|---|---|---|
| `instrumentId.symbol` | string | The ticker ("nombre del contrato en el sistema de negociación"). Futures look like `SOJ.ROS/MAY23`, options like `TRI.ROS/DIC23 352 C` |
| `instrumentId.marketId` | string | `ROFX` (Matba Rofex) or `MERV` (external markets) |
| `symbol` | `null` | Always `null` in this response |
| `segment.marketSegmentId` | string | Segment; `DDA` for grains |
| `currency` | string | Settlement currency ("moneda de liquidación"), e.g. `USD` |
| `lowLimitPrice`, `highLimitPrice` | number | Daily price limits for trading the contract |
| `minPriceIncrement` | number | Price tick |
| `contractMultiplier` | number | Contract size |
| `priceConvertionFactor` | number | Factor that turns the quoted price into a unit price (spelled "Convertion" in the API) |
| `maturityDate` | string, `YYYYMMDD` | Maturity date |
| `cficode` | string | Instrument type: `FXXXSX` future, `OCAFXS` call on a future, `OPAFXS` put on a future |
| `tickPriceRanges` | object keyed `"0"`, `"1"`, … | Price bands, each `{lowerLimit, upperLimit, tick}`; `upperLimit: null` means no upper bound |

**Confirmed** ([Spec], examples and *Anexo - Diccionario de Campos*). The remaining fields describe order entry.

## Market data snapshot (REST)

```http
GET /rest/marketdata/get?marketId=ROFX&symbol=DLR/DIC23&entries=BI,OF,LA,OP,CL,SE,OI&depth=3
```

- `entries` is a comma-separated list from the table below.
- `depth` sets how many book levels `BI` and `OF` return, from 1 to 5; the default is 1.

**Confirmed** ([Spec]).

| Entry | Meaning | Format |
|---|---|---|
| `BI` | Best bids | Array of `{price, size}`, best first |
| `OF` | Best offers | Array of `{price, size}`, best first |
| `LA` | Last traded price | `{price, size, date}` |
| `OP` | Opening price | Number |
| `CL` | Previous session's close | `{price, size, date}` |
| `SE` | Settlement price (*precio de ajuste*; futures only) | `{price, size, date}` |
| `OI` | Open interest (futures only) | `{price, size, date}`, with the contracts in `size` |
| `HI`, `LO` | Session high and low | **Unknown** |
| `TV` | Volume traded | **Unknown** |
| `IV` | Index value (indices only) | Object with `price` (**Observed**, [#8]) |
| `EV`, `NV` | Effective and nominal volume; ByMA instruments only | **Unknown** |
| `ACP` | Current day's closing price | **Unknown** |

The meanings and the formats shown are **Confirmed** ([Spec]). pyRofex also defines a `TC` (trade count) entry that the spec doesn't mention ([pyRofex] `enums.py`).

The spec's response:

```json
{"status":"OK",
 "marketData":{
   "SE":{"price":180.3,"size":null,"date":1669852800000},
   "LA":{"price":179.85,"size":4,"date":1669995044232},
   "OI":{"price":null,"size":217596,"date":1664150400000},
   "OF":[{"price":179.8,"size":1000},{"price":180.35,"size":1000}],
   "OP":180.35,
   "CL":{"price":180.35,"size":null,"date":1669852800000},
   "BI":[{"price":179.75,"size":275},{"price":178.95,"size":514}]},
 "depth":2,
 "aggregated":true}
```

- **Timestamps:** `LA.date` 1669995044232 is 2022-12-02 15:30:44 UTC, 12:30 in Argentina, during the session. `SE` and `CL` carry 2022-12-01 00:00 UTC, and `OI` 2022-09-26 00:00 UTC. **Inferred:** those three mark a business day, not a time.
- **Depth:** the request asked for `depth=3` and the response says `"depth":2` with two levels, so `depth` may report the levels actually returned. **Inferred**.
- **`aggregated`:** `true` in every example and report, and the spec doesn't define it. **Unknown**.

Requested entries with no data come back as `null`. Two reMarkets responses that users posted, printed by pyRofex as Python dicts, where `None` is JSON `null` ([#34], [#35]):

```text
DLR/ENE24, January 2024:
{'status': 'OK', 'marketData': {'LA': None, 'OF': None, 'BI': None}, 'depth': 2, 'aggregated': True}

SOJ.ROS/JUL24 320 C, May 2024:
{'status': 'OK', 'marketData': {'LA': None, 'BI': None, 'OF': None, 'OI': None}, 'depth': 1, 'aggregated': True}
```

For a Rosario grain future, a response in the documented shapes would look like this. It is **constructed** for mocks and tests, not a real response; the date is 2026-10-23 15:00 UTC:

```json
{"status":"OK",
 "marketData":{
   "LA":{"price":318.5,"size":3,"date":1792767600000},
   "BI":[{"price":318.0,"size":10}],
   "OF":[{"price":319.0,"size":5}]},
 "depth":1,
 "aggregated":true}
```

The recommended request rate is at most one snapshot per second ([main research §3.4](a3-mercados-apis.md#34-subscription-mechanics-and-limits)).

## Market data stream (WebSocket)

- Connect to the WebSocket host with an `X-Auth-Token` header on the handshake. pyRofex pings every 30 seconds. **Confirmed** ([pyRofex] `websocket_rfx.py`, `globals.py`).
- Subscribe with this message ([Spec]; the same template is in [pyRofex] `messages.py`):

  ```json
  {"type":"smd","level":1,"entries":["OF"],"depth":2,
   "products":[{"symbol":"DLR/DIC23","marketId":"ROFX"},
               {"symbol":"SOJ.ROS/MAY23","marketId":"ROFX"}]}
  ```

- The server then sends one message per instrument each time its data changes, with only the subscribed entries ([Spec]):

  ```json
  {"type":"Md",
   "instrumentId":{"marketId":"ROFX","symbol":"DLR/DIC23"},
   "marketData":{"OF":[{"price":189,"size":21},{"price":188,"size":13}]}}
  ```

- pyRofex routes messages on `type`, ignoring case: `Md` is market data and `or` an order report. A message with `"status":"ERROR"` is an error. **Confirmed** ([pyRofex] `websocket_rfx.py`).
- Real `Md` messages appear to include a top-level `timestamp` in epoch milliseconds. In 2020 a user's handler read `message['timestamp']`, and the maintainer's corrected handler kept it. That user was on LBO's xOMS, another deployment of the same platform. **Observed** ([#8]).
- **Unknown:** whether each `Md` message repeats every subscribed entry or only the ones that changed. The spec's example subscribes to `OF` alone, so it can't tell.

## Trade history

```http
GET /rest/data/getTrades?marketId=ROFX&symbol=DLR/DIC23&date=2023-08-05
```

- Pass `date`, or `dateFrom` and `dateTo`, all as `YYYY-MM-DD`.
- On reMarkets, add `environment=REMARKETS`.
- `external=true` is for instruments of other markets.

**Confirmed** ([Spec]).

```json
{"status":"OK","symbol":"DLR/DIC23","market":"ROFX",
 "trades":[
   {"symbol":"DLR/DIC23","servertime":1659714475948,"size":25,"price":183.6,"datetime":"2023-08-05 15:47:55.948"},
   {"symbol":"DLR/DIC23","servertime":1659715021103,"size":1,"price":183.56,"datetime":"2023-08-05 15:57:01.103"}]}
```

- `servertime` is when the trade happened, in epoch milliseconds, and `datetime` is the trade's date and time as text. **Confirmed** ([Spec], field dictionary).
- In the example, `datetime` matches `servertime` read in UTC, but its year is 2023 where `servertime` says 2022, so the example was edited by hand. Rely on `servertime`. **Inferred**.

## How the feed client matches

`src/feed/a3Client.ts` (merged in PR #5) calls `getToken`, `instruments/details`, and `marketdata/get` with `entries=LA,BI,OF&depth=1`.

| Format detail | What the client does |
|---|---|
| Token in the `X-Auth-Token` response header | Reads it; fails if the login isn't 2xx or the header is missing |
| Expired or missing token: 401 (pyRofex) or a 302 to `/login.html` (reMarkets) | Treats both as "log in again" and retries once |
| `"status":"ERROR"` with `description` and/or `message` | Throws with whichever text is present. A non-2xx response is reported by its HTTP code only |
| Ticker in `instrumentId.symbol`; top-level `symbol` is `null` | Reads `instrumentId.symbol` |
| Segment, currency, daily limits | Reads `segment.marketSegmentId`, `currency`, `lowLimitPrice`, `highLimitPrice` |
| Entries can be `null`, `BI` and `OF` included | Treats `null` or a missing entry as no data |
| `LA.date` in epoch milliseconds | Converts it with `new Date(date)` |

Everything the client reads matches the documented and observed formats.

## Unknowns

- The HTTP status that comes with `"status":"ERROR"`, and the body of a failed login.
- Whether WebSocket `Md` messages carry every subscribed entry or only the changed ones, and whether `timestamp` is always present.
- The formats of `HI`, `LO`, `TV`, `EV`, `NV` and `ACP`.
- What `aggregated` means.
- What the `U-DDF`, `U-DDA` and `U-DUAL` segments are.
- The rate limits actually enforced. The published recommendations are in [main research §3.4](a3-mercados-apis.md#34-subscription-mechanics-and-limits).

## Sources

- [Spec] Primary, *Documentación Primary API* v1.21 (02/12/2022). Its examples run against reMarkets.
- [A3 spec] A3 Mercados, *API Trading A3 (REST/WS)* v1.21 (01/04/2025), the same spec republished for the A3 integration. Its market data, trade history, WebSocket and error examples are identical to [Spec]'s; it drops the Risk API chapter.
- [pyRofex] The official Python client, matbarofex/pyRofex at commit `bb03a09` (2023-11-12). Files used: `src/pyRofex/components/globals.py`, `urls.py`, `messages.py` and `enums.py`; `src/pyRofex/clients/rest_rfx.py` and `websocket_rfx.py`.
- [Guide] Primary, *Guía de implementación Primary API: MarketData*, a single image.
- [#34] pyRofex issue 34, "No hay live market data" (2024-01-05).
- [#35] pyRofex issue 35, "No bid ask for options on agro futures…" (2024-05-09), with the maintainer's reply.
- [#8] pyRofex issue 8, "Inconvenientes al obtener IV de los indices por websocket" (2020-08-03).

[Spec]: https://apihub.primary.com.ar/assets/docs/Primary-API.pdf
[A3 spec]: https://a3mercados.com.ar/api/site-docs/api-trading-rest
[pyRofex]: https://github.com/matbarofex/pyRofex/tree/bb03a096e3d9f830486f7ce619c6c70e0889e8fe/src/pyRofex
[Guide]: https://apihub.primary.com.ar/assets/guias/marketdata.html
[#34]: https://github.com/matbarofex/pyRofex/issues/34
[#35]: https://github.com/matbarofex/pyRofex/issues/35
[#8]: https://github.com/matbarofex/pyRofex/issues/8
