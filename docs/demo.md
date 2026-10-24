# Demo script

About 5 minutes. Run `pnpm seed`, then `pnpm dev`, and open `/admin`. Every login uses the password `demo1234`. Use two browser windows (one normal, one private) when the script shows two logins at once.

| Login | Who | Empresa | Role |
|---|---|---|---|
| `admin@shipagro.test` | Admin ShipAgro | all | super-admin |
| `ana@pampa.test` | Ana Ferreyra | Corredora Pampa SA | Administrador |
| `bruno@pampa.test` | Bruno Castro | Corredora Pampa SA | Comercial |
| `carla@norte.test` | Carla Ruiz | Acopio del Norte SRL | Administrador |
| `diego@norte.test` | Diego Paz | Acopio del Norte SRL | Comercial |

The seed loads 15 Contactos, 9 Operaciones (covering every Etapa, three overdue, one due today, two a fijar) and 4 Precios gatillo 1–3% from the latest Cotización:

| Empresa | Contacto | Instrumento | Lado | Último | Objetivo | Cerca desde |
|---|---|---|---|---|---|---|
| Pampa | Juan Pérez | SOJ.ROS/MAY27 | venta | 318 | 325 | 321,75 |
| Pampa | Cooperativa Agrícola Unión | MAI.ROS/ABR27 | venta | 186 | 190 | 188,10 |
| Pampa | Molino San Martín SA | TRI.ROS/DIC26 | compra | 210 | 206 | 208,06 |
| Norte | Marta Gómez | SOJ.ROS/MAY27 | venta | 318 | 327 | 323,73 |

## 1. The day starts (Bruno, 1 min)

Log in as `bruno@pampa.test`.

- The dashboard shows **Mis pendientes**: Sofía Bianchi's soja Operación (Registrada, vencida hace 3 días), followed by Juan Pérez's (Confirmada, vencida ayer).
- **Operaciones** lists only Corredora Pampa SA. Nothing from Acopio del Norte SRL appears anywhere.
- **Precios gatillo** shows Juan Pérez's venta at 325 for SOJ.ROS/MAY27, Activo.

## 2. The price gets close (1 click)

The prices are simulated: no A3 connection is involved, and any Usuario can move them. In the dashboard footer, press **Simular cotizaciones**.

- Each Instrumento with an active Precio gatillo gets a new Cotización at its *cerca* price: SOJ.ROS/MAY27 at 321,8, MAI.ROS/ABR27 at 188,1, TRI.ROS/DIC26 at 208.
- Three **Alertas cerca** appear under open Alertas: Juan Pérez (venta 325), Cooperativa Agrícola Unión (venta 190) and Molino San Martín SA (compra 206). Their Responsables get the email.
- Marta Gómez's trigger in Norte stays quiet: 321,8 is below 99% of 327.
- The **Cotizaciones** list shows the simulated trades, and the dashboard header says **Simulación al día**.

With no SMTP set, email goes to ethereal.email; the test inbox credentials are printed by `pnpm dev`. Emails are the only part of this step that can't be shown from the deployed app.

## 3. The price arrives (1 click)

Press **Simular cotizaciones** again.

- The same Instrumentos trade at their targets: SOJ.ROS/MAY27 at 325, MAI.ROS/ABR27 at 190, TRI.ROS/DIC26 at 206.
- Their Precios gatillo move to **Alcanzado**, with an **Alerta alcanzado** for each, and Juan Pérez's soja trigger also brings Marta Gómez's in Norte to **cerca** (325 ≥ 323,73).
- Press it a third time and SOJ.ROS/MAY27 trades at 327: **Alcanzado** for Marta Gómez, and nothing new for Pampa.

Prefer typing an exact price? The super-admin can still do it in **Cotizaciones → Crear**, Fuente `Manual`, Hora de la operación **now** (the rules ignore trades older than 5 minutes).

## 4. Close the deal (Bruno, 1 min)

Open the alcanzado Alerta and set **Resolución → Confirmar**. The Precio gatillo becomes **Confirmado** and a new **Operación** (Concertada) opens for Juan Pérez, linked to it.

Optional: repeat the Resolución with `TRI.ROS/DIC26` at `206`, the compra trigger the same two presses already brought to Alcanzado, to see a Comprador created instead of a Vendedor.

## 5. Each Empresa stays apart (1 min)

- As `diego@norte.test` (Comercial), open **Usuarios**: there's no "Crear nuevo", and editing Carla fails.
- As `ana@pampa.test` (Administrador), open Bruno: only Corredora Pampa SA is available under **Empresas**, and the super-admin checkbox is read-only. An API attempt to assign Acopio del Norte SRL is also rejected with "Solo podés asignar, quitar o cambiar el rol de Empresas donde sos Administrador."
- As `admin@shipagro.test`, the Empresa selector in the sidebar switches between both Empresas.
