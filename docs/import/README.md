# Importar Contactos y Operaciones desde una planilla

ShipAgro imports a CSV once, through Payload's import-export plugin, which runs synchronously: the result shows as soon as the upload finishes. Import **Contactos first**, then Operaciones, because an Operación points at its Vendedor and Comprador.

Templates: [`contactos.csv`](contactos.csv) and [`operaciones.csv`](operaciones.csv). Keep the header row exactly as it is (the column names are the field names, in English); delete the example rows.

## Where the rows land

Every row goes into one Empresa:

1. In the admin sidebar, pick the Empresa in the **Empresa** selector.
2. Leave the `tenant` column out, or empty: each row takes the selected Empresa.

A super-admin can instead fill `tenant` with the Empresa's ID (the number at the end of its URL, `/admin/collections/tenants/<id>`). Anyone else can only import into Empresas they belong to; a row naming another Empresa is rejected.

## Running the import

1. Open **Contactos** (or **Operaciones**) and choose **Importar** in the list menu.
2. Upload the CSV, keep **Modo de importación → Crea nuevos documentos**, check the preview and click **Iniciar importación**.
3. The summary lists rows created and rows with errors; fix those rows and import just them again.

## Contactos

| Column | Required | Values |
|---|---|---|
| `name` | yes | Nombre o razón social |
| `type` | yes | `productor`, `acopio`, `cooperativa`, `exportadora`, `industria`, `otro` |
| `cuit` | no | `30-71234567-8` |
| `phone` | no | Teléfono |
| `email` | no | Email |
| `locality` | no | Localidad |

## Operaciones

| Column | Required | Values |
|---|---|---|
| `seller` | yes | ID of the Vendedor's Contacto |
| `buyer` | no | ID of the Comprador's Contacto |
| `grain` | yes | `soja`, `maiz`, `trigo`, `girasol`, `sorgo`, `cebada` |
| `tons` | no | Toneladas, with a dot for decimals: `500` or `250.5` |
| `price` | no | Precio por tonelada, dot for decimals; empty if a fijar |
| `currency` | no | `USD` (default) or `ARS` |
| `aFijar` | no | `true` or `false` |
| `stage` | yes | `concertada`, `confirmada`, `registrada`, `en-entrega`, `entregada`, `precio-fijado`, `liquidada`, `cobrada` |
| `responsable` | yes | ID of a Usuario of the same Empresa |
| `dueDate` | no | Plazo as `AAAA-MM-DD` |
| `deliveryConditions` | no | Free text |

### Referencing a Contacto or Usuario

Relationship columns take the **ID** of the referenced document, not its name. To get them after importing Contactos, open **Contactos → Exportar** (format CSV, fields `id` and `name`) and use a `BUSCARV`/`VLOOKUP` in the spreadsheet to turn each Vendedor's name into its ID. A Usuario's ID is the number at the end of its URL in **Usuarios**. The Contacto and the Usuario must belong to the same Empresa as the Operación.

## Exporting the CSV from Excel

1. Keep one sheet with the header row in row 1 and no merged cells, totals or blank rows in between.
2. Format the `dueDate` column as text `AAAA-MM-DD`, and use a dot as the decimal separator (in Argentine Excel, change it under *Archivo → Opciones → Avanzadas*, or replace `,` with `.` in those columns before saving).
3. **Archivo → Guardar como → CSV UTF-8 (delimitado por comas) (*.csv)**. Plain "CSV (delimitado por comas)" in a Spanish locale uses `;` and loses accents.
4. In Google Sheets: **Archivo → Descargar → Valores separados por comas (.csv)**.
