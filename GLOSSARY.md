# ShipAgro

ShipAgro helps Argentine grain businesses follow every Operación to completion and tells their people when a Contacto's Precio gatillo is near or reached on A3 Mercados. It never trades, negotiates or closes deals; people decide.

## Language

### People and companies

**Empresa**:
A business that pays for ShipAgro (corredora, acopio, cooperativa) and gets its own isolated instance; nothing inside one Empresa is visible to another.
_Avoid_: tenant (outside code), cliente, cuenta, organización

**Usuario**:
An employee of an Empresa who logs in to its instance, as an Administrador or a Comercial.
_Avoid_: empleado, seller, broker (when meaning any login)

**Administrador**:
A Usuario who can do everything a Comercial does and also manages the Empresa's Usuarios.
_Avoid_: admin, gerente

**Comercial**:
A Usuario who works with the Empresa's Contactos, Operaciones and Precios gatillo.
_Avoid_: corredor (not every Empresa is a corredora), vendedor (that's a party to an Operación), broker

**Contacto**:
A person or company an Empresa does business with, such as a Productor, an acopio, a cooperativa, an exportadora or an industria. Shared by all Usuarios of that Empresa; never logs in.
_Avoid_: cliente, customer, cuenta

**Productor**:
A Contacto who grows grain; the most common Vendedor.
_Avoid_: chacarero

**Vendedor**:
The Contacto who sells the grain in an Operación, such as a Productor, an acopio or a cooperativa. The same Contacto can be the Vendedor in one Operación and the Comprador in another.
_Avoid_: productor (when the seller isn't one), oferente

**Comprador**:
The Contacto who buys the grain in an Operación, such as an exportadora, an industria or an acopio.
_Avoid_: exportador (too narrow), demanda

### Deals and follow-up

**Operación**:
One grain deal between a Vendedor and a Comprador that the Empresa intermediates, followed through its Etapas until it is paid.
_Avoid_: negocio, contrato (the document, not the deal), deal, trade

**Etapa**:
One step in the fixed sequence every Operación goes through: Concertada, Confirmada, Registrada, En entrega, Entregada, Precio fijado (only for "a fijar" deals), Liquidada, Cobrada.
_Avoid_: estado, paso, fase

**Responsable**:
The Usuario accountable for an Operación's current Etapa, or for a Precio gatillo.
_Avoid_: owner, asignado, dueño

**Plazo**:
The date by which an Operación's current Etapa should be done.
_Avoid_: deadline, vencimiento

**Pendiente**:
Something a Usuario has to act on: the current Etapa of an Operación they are Responsable for, or an Alerta awaiting their Resolución.
_Avoid_: tarea, to-do, ticket

### Prices and alerts

**Instrumento**:
A contract listed on A3 Mercados whose price ShipAgro watches, such as soja futures for delivery in Rosario in May.
_Avoid_: producto, ticker, símbolo (the símbolo only identifies an Instrumento)

**Cotización**:
A price of an Instrumento observed at a given moment, together with where it came from.
_Avoid_: precio (too generic), quote, tick

**Precio gatillo**:
A Contacto's standing request to be told when one Instrumento trades at or beyond a Precio objetivo (at or above it for a venta, at or below it for a compra), with the delivery conditions they would accept. It never executes anything.
_Avoid_: orden (implies execution), alarma, target

**Precio objetivo**:
The price, in its Instrumento's currency, at which a Precio gatillo counts as reached.
_Avoid_: precio meta, strike

**Vigencia**:
The optional date after which a Precio gatillo is no longer watched.
_Avoid_: vencimiento, expiración

**Alerta**:
A notice that a Precio gatillo is near (cerca) or has reached (alcanzado) its Precio objetivo.
_Avoid_: aviso, notificación (the delivery, not the event), señal

**Resolución**:
The Responsable's recorded decision on an Alerta alcanzado: confirmar (the Contacto agreed, which opens an Operación), actualizar (a new Precio objetivo) or cancelar.
_Avoid_: aprobación, validación, confirmación (that's one of the outcomes)
