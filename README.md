# Gastos Ricaso

App para que Mariano y Hernán registren los gastos de Ricaso desde el celular.
Es un solo archivo, `index.html`, sin instalación ni servidor.

**Dirección de la app:** https://ignaberga.github.io/RICASO-GASTOS-APP/

## Qué hace

Registra un gasto con: quién lo carga, local (Nueva Córdoba, Tejeda o CDP),
fecha, proveedor, forma de pago, monto y nota.

- **Inicio** — total del mes, abierto por local, y los últimos movimientos.
- **Historial** — filtros por local, persona, forma de pago, proveedor y texto.
- **Resumen** — el mes por forma de pago, por local, por proveedor y por persona.
- **Config** — listas de proveedores y formas de pago, y el vínculo con la planilla.

## Dónde viven los datos

**La planilla de Google es la base de datos.** Ahí viven los gastos y también
las listas de proveedores y formas de pago. Los tres teléfonos leen de la
planilla al abrir la app y escriben en ella cada cambio, así todos ven lo
mismo: si Mariano agrega un proveedor, le aparece a Hernán.

Cada teléfono guarda además una copia local, que sirve para que la app abra al
instante y para seguir cargando sin señal. Lo que quede sin subir se marca en
Config y se manda solo cuando vuelve la conexión.

La planilla tiene dos hojas, las dos editables a mano desde Google:

| Hoja | Contenido |
| --- | --- |
| `Gastos` | Un gasto por fila, identificado por su ID |
| `Listas` | Columna A: proveedores. Columna B: formas de pago |

Se conecta desde Config → Planilla de Google, pegando la dirección de la
aplicación web de Apps Script (la que termina en `/exec`). No es el link de la
planilla: es el que da Google al publicar el script. Hay que hacerlo una vez
en cada teléfono.

Cada gasto viaja con un ID, así que editar corrige la fila existente en lugar
de duplicarla, y renombrar un proveedor lo corrige en todos los gastos de una
sola vez. El botón **Actualizar ahora**, o tocar el indicador de estado arriba
a la derecha, fuerza una sincronización.

## Instalar en el celular

Abrir la dirección de arriba y agregarla a la pantalla de inicio:

- **iPhone** — en Safari: Compartir → Agregar a inicio.
- **Android** — en Chrome: menú de tres puntos → Agregar a pantalla principal.

Queda con ícono propio y a pantalla completa. No es una app de tienda: es la
página web, así que se actualiza sola.

## Actualizar la app

Reemplazar `index.html` en este repositorio. La versión nueva llega a todos los
teléfonos la próxima vez que abren la app.

El navegador guarda una copia por unos diez minutos, así que un cambio puede
tardar ese rato. Para forzarlo: Config → Buscar actualización.

El número de versión está en Config, abajo de todo, para saber qué tiene cada
teléfono.

**Actualizar la app no borra datos.** Lo único que los borraría es cambiar la
dirección web, porque para el navegador sería otro sitio. Aun así, la planilla
conserva todo.

## Advertencia sobre el nombre del repositorio

La dirección de la app depende del nombre de este repositorio. Si se renombra,
cambia la dirección, y los teléfonos que tengan el acceso directo viejo dejan de
encontrarla y arrancan sin datos locales. Conviene no tocarlo.
