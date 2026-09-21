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

En **dos lugares a la vez**:

1. **En cada teléfono**, para que la app funcione al instante y sin señal.
2. **En la planilla de Google**, que es la copia real y consolidada.

La planilla se conecta desde Config → Planilla de Google, pegando la dirección
de la aplicación web de Apps Script (la que termina en `/exec`). No es el link
de la planilla: es el que da Google al publicar el script.

Cada gasto viaja con un ID propio, así que editar en la app corrige la fila
existente en lugar de duplicarla. Si un envío falla, queda en cola y se
reintenta al abrir la app. El botón **Reenviar todo** repone la planilla entera.

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
