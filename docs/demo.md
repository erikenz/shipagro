# Demo script

About 5 minutes. Run `pnpm seed`, then `pnpm dev`, and open `/admin`. Every login uses the password `demo1234`. Use two browser windows (one normal, one private) so the super-admin and a Usuario can be logged in at the same time.

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

## 2. The price gets close (super-admin, 1 min)

In the other window, log in as `admin@shipagro.test` and open **Cotizaciones → Crear nuevo**:

- Instrumento `SOJ.ROS/MAY27`, Precio `322`, Fuente `Manual`, Hora de la operación **now** (the rules ignore trades older than 5 minutes).

Back in Bruno's window, refresh: an **Alerta cerca** for Juan Pérez appears under open Alertas, and Bruno gets the email. With no SMTP set, log into https://ethereal.email using the test inbox credentials printed by the sending process (`pnpm dev` for manual Cotizaciones, `pnpm feed` for reMarkets). Each process can have its own test inbox. Marta Gómez's trigger in Norte stays quiet: 322 is below 99% of 327.

## 3. The price arrives (super-admin, 1 min)

Enter another Cotización: `SOJ.ROS/MAY27`, `325`, Manual, now.

- Bruno: an **Alerta alcanzado** for Juan Pérez, and the Precio gatillo moves to **Alcanzado**.
- Log in as `diego@norte.test`: an **Alerta cerca** for Marta Gómez (325 ≥ 323,73), and nothing about Juan Pérez.

## 4. Close the deal (Bruno, 1 min)

Open the alcanzado Alerta and set **Resolución → Confirmar**. The Precio gatillo becomes **Confirmado** and a new **Operación** (Concertada) opens for Juan Pérez, linked to it.

Optional: repeat steps 2–3 with `TRI.ROS/DIC26` at `208` then `206` to show a compra.

## 5. Each Empresa stays apart (1 min)

- As `diego@norte.test` (Comercial), open **Usuarios**: there's no "Crear nuevo", and editing Carla fails.
- As `ana@pampa.test` (Administrador), open Bruno: only Corredora Pampa SA is available under **Empresas**, and the super-admin checkbox is read-only. An API attempt to assign Acopio del Norte SRL is also rejected with "Solo podés asignar, quitar o cambiar el rol de Empresas donde sos Administrador."
- As `admin@shipagro.test`, the Empresa selector in the sidebar switches between both Empresas.
