# CLAUDE.md — Gastos Ricaso

## Qué es esto

App para que en **Ricaso** carguen los gastos desde el celular. Ricaso es un
local de hamburguesas y wraps de **Olveira Anello S.A.S.**, con dos sucursales
(**Nueva Córdoba** y **Tejeda**) más **CDP**. Hay una tercera sucursal,
Manantiales, que **no** es de Olveira Anello y por ahora queda afuera.

**Ignacio** es contador público y el dueño de este repositorio. Ricaso es cliente
del estudio donde trabaja, y además le pidieron llevar la contabilidad de gestión
interna. Antes de esta app los gastos no se registraban en ningún lado: la idea
es que Mariano y Hernán los carguen en el momento y que la planilla quede como
base de datos para armar informes.

## Quién usa la app

- **Mariano**: carga gastos desde el celular.
- **Hernán**: carga gastos desde el celular.
- **Ignacio**: la tiene en el celular, revisa los datos y la planilla, y maneja
  las listas de proveedores y formas de pago.

Ninguno de los tres programa. Cada cambio tiene que pensarse para alguien que usa
el celular en el mostrador, apurado. **Menos pasos es mejor.**

## Cómo trabajar con Ignacio

- **Ignacio no sabe programar.** Claude hace todos los cambios e Ignacio los
  prueba en el celular. Las explicaciones van en **castellano rioplatense
  simple**, sin jerga técnica.
- **Preguntar antes de actuar.** Explicar qué se va a hacer y esperar su
  confirmación, para no trabajar de más en algo que no quería.
- Cualquier push a `main` **publica la app al instante en los tres teléfonos**
  (GitHub Pages). **Nunca publicar sin el OK explícito de Ignacio.** Cuando lo
  da, se publica directo en `main`: no quiere versiones de prueba aparte.
- Antes de publicar, probar el cambio en Chromium (Playwright) simulando la
  planilla, **incluido el caso sin señal**.
- Si algo puede hacer perder datos ya cargados, avisarlo claramente y primero.

## El proyecto

- `index.html`: toda la app en un solo archivo (HTML, CSS y JS juntos), sin
  librerías externas, sin build y sin servidor. Se publica en
  https://ignaberga.github.io/RICASO-GASTOS-APP/ y se instala como acceso
  directo en la pantalla de inicio. No es app de tienda.
- `README.md`: instrucciones para Mariano y Hernán.
- `Codigo-AppsScript.gs`: copia de respaldo del **Apps Script** que conecta con
  la planilla. El que funciona de verdad está pegado dentro de la planilla
  (Extensiones → Apps Script) y lo actualiza Ignacio a mano. Si se cambia, darle
  los pasos: pegar, guardar y **Administrar implementaciones → Nueva versión**
  (nunca "Nueva implementación", que cambia el link). Mantener el archivo del
  repo igual al que está en la planilla.

## Cómo funcionan los datos

- La **planilla de Google es la base de datos real**, compartida por los tres
  teléfonos. Tiene dos hojas: `Gastos` (una fila por gasto, 10 columnas) y
  `Listas` (columna A proveedores, columna B formas de pago). Las dos se pueden
  editar a mano desde Google y los teléfonos lo levantan.
- La app lee con `GET` y escribe con `POST`. Operaciones: **`upsert`**,
  **`delete`**, **`listas`**, **`renombrar`** y **`ping`**. Todas se pueden
  repetir sin duplicar. La respuesta trae siempre el estado completo:
  `{ok:true, api:2, gastos, proveedores, mediosPago, hora}`.
- Un gasto tiene: `id`, `fecha`, `establecimiento`, `proveedor`, `medioPago`,
  `monto`, `persona`, `nota`, `creado`.
- **Cola de pendientes** (`ricaso_outbox`): cada cambio se guarda primero en el
  celular y se manda en orden, con reintentos (cada 30 s si hay algo pendiente,
  la planilla completa cada 5 minutos, al volver la señal y al abrir la app),
  hasta que la planilla confirma. Al leer la planilla, los pendientes se aplican
  encima, así nada cargado sin señal desaparece. El chip de estado muestra
  cuántos faltan subir.
- Cada teléfono guarda una copia local (`ricaso_gastos`, `ricaso_proveedores`,
  `ricaso_mediosPago`) para abrir al instante y funcionar sin señal.
- La dirección del Apps Script (la que termina en `/exec`) se guarda en
  `ricaso_sheet_url` y además viaja en el **link de instalación**:
  `…/RICASO-GASTOS-APP/#vincular=<dirección>&quien=Mariano`. Ese link queda
  grabado en el ícono de la pantalla de inicio, así el celular no se desvincula
  nunca (en iPhone, Safari y el ícono guardan datos por separado). **No borrar
  el `#…` de la dirección** ni agregar un manifest con `start_url`, porque se
  perdería. Config sigue teniendo el campo para pegarla a mano, por si acaso.
- Personas que cargan: `Mariano` y `Hernán` (constante `PERSONAS`). Cada teléfono
  recuerda quién lo usa (`ricaso_persona`) y no lo vuelve a preguntar.
- Los links de instalación **no se generan dentro de la app**: se los arma Claude
  en el chat cuando Ignacio pasa la dirección `/exec`, y nunca se guardan en el
  repo.
- **Editar** un gasto usa `upsert` con el mismo `id`. **Borrar** usa `delete` y
  siempre pide confirmación mostrando el monto.
- El monto se escribe en formato argentino (`100.006,29`), con los puntos de
  miles puestos mientras se tipea, y se guarda como número con 2 decimales. Si
  el teclado del celular solo tiene punto, el punto se toma como coma.

## Reglas firmes

- **La dirección `/exec` del Apps Script nunca va en el repositorio** (ni en el
  código, ni en commits, ni en issues). Es la llave de los datos y el repo es
  público.
- **Mantener un solo archivo, simple y sin dependencias externas.**
- **No cargar proveedores de arriba.** Ignacio fue explícito: los quiere agregar
  de a uno desde Config. No sembrar la lista con los proveedores de Fudo ni con
  ninguna otra lista: a varios de ellos no se les compra con tarjeta.
- **Una respuesta incompleta de la planilla nunca puede pisar los datos del
  teléfono.** Que la planilla contteste `ok:true` no significa que haya mandado
  los gastos: el script viejo hacía justo eso y vaciaba la app. La función
  `estadoValido()` exige que venga el array `gastos`; mantenerla.
- **Actualizar la app nunca debe borrar datos.** No cambiar la dirección web del
  sitio, porque para el navegador sería otro sitio y se perdería lo guardado en
  cada teléfono.
- No cambiar cómo se guardan los datos (campos de un gasto, claves de
  `localStorage`, operaciones hacia el Apps Script) sin avisarle a Ignacio. Un
  cambio así puede romper la planilla o dejar datos huérfanos.
- Ninguna sincronización puede borrar gastos en forma masiva, ni de la app ni de
  la planilla. Lo que carga Mariano tiene que aparecerle a Hernán y a Ignacio, y
  al revés.
- **Textos en castellano rioplatense y con tildes.** Los valores ya guardados en
  la planilla no se renombran desde el código: dejarían huérfanos los gastos
  viejos. Para eso está la operación `renombrar`.
- Al releer la planilla no se puede pisar lo que la persona está escribiendo en
  el formulario abierto.
- En iPhone, Safari y el ícono de la pantalla de inicio guardan los datos por
  separado, e iOS puede borrar datos de sitios poco visitados. Tenerlo en cuenta
  en todo lo que dependa de `localStorage`.

## Historial de decisiones

- Septiembre 2026: primera versión con gastos solamente. Campos: quién carga,
  local, fecha, proveedor, monto y nota. Después se agregó la forma de pago y una
  sección Config para manejar las listas de proveedores y formas de pago.
- Se pasó al modelo compartido: los gastos **y** las listas viven en la planilla,
  así los tres teléfonos ven lo mismo.
- Se arregló el bug que vaciaba la app en cada sincronización (el script viejo
  contestaba `ok:true` sin los gastos y la app lo tomaba como estado válido).
- Septiembre 2026 (27): se trajo de la app de La Emilia el **link de instalación**
  con la dirección de la planilla adentro, los **reintentos automáticos** (30 s /
  5 min / al volver la señal) y el **monto con puntos de miles**.
- Cada gasto tiene un **lápiz** que abre Editar / Eliminar / Cancelar. Tocar la
  fila ya no abre nada. Eliminar cierra el menú y después pide confirmación
  mostrando proveedor, monto, fecha y local; si se cancela, vuelve a la lista.
- De Config se sacó **vincular la planilla** (el campo de la dirección, "Guardar"
  y "Probar conexión"): con el link de instalación no hace falta y solo confundía.
  Quedó la sección **Sincronización**, con el estado y "Actualizar ahora".

## Pendientes conversados

- Ignacio tiene que confirmar que la planilla ya tiene pegada la última versión
  del Apps Script. Si el chip de estado dice "Script viejo", todavía no está.
- Definir si CDP sigue en la lista de locales o si se saca.
