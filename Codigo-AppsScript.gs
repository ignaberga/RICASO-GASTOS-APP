/**
 * Gastos Ricaso — base de datos compartida en una hoja de Google.
 *
 * La planilla es la fuente de verdad. Los teléfonos leen todo de acá al abrir
 * la app y escriben acá cada cambio, así los tres ven siempre lo mismo.
 *
 * Crea dos hojas solas:
 *   Gastos  — un gasto por fila, identificado por su ID.
 *   Listas  — columna A: proveedores. Columna B: formas de pago.
 *
 * Se pueden editar las dos a mano desde Google y los teléfonos lo levantan.
 */

var HOJA_GASTOS = 'Gastos';
var HOJA_LISTAS = 'Listas';
var COLUMNAS = [
  'ID', 'Fecha', 'Local', 'Proveedor', 'Forma de pago',
  'Monto', 'Cargado por', 'Nota', 'Creado', 'Actualizado'
];

/* ---------------------------------------------------------------- lectura */

function doGet() {
  try {
    return responder_(estado_());
  } catch (err) {
    return responder_({ ok: false, error: String(err) });
  }
}

/* --------------------------------------------------------------- escritura */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return responder_({ ok: false, error: 'La planilla estaba ocupada. Reintentá.' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder_({ ok: false, error: 'No llegaron datos.' });
    }
    var c = JSON.parse(e.postData.contents);

    if (c.op === 'upsert') {
      guardarGasto_(c.gasto);
    } else if (c.op === 'delete') {
      borrarGasto_(c.id);
    } else if (c.op === 'listas') {
      guardarListas_(c.proveedores || [], c.mediosPago || []);
    } else if (c.op === 'renombrar') {
      renombrar_(c.campo, c.viejo, c.nuevo);
    }
    // 'ping' y cualquier otra cosa simplemente devuelven el estado.

    return responder_(estado_());

  } catch (err) {
    return responder_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ estado */

function estado_() {
  var listas = leerListas_();
  return {
    ok: true,
    api: 2,
    gastos: leerGastos_(),
    proveedores: listas.proveedores,
    mediosPago: listas.mediosPago,
    hora: new Date().toISOString()
  };
}

/* ------------------------------------------------------------------ gastos */

function hojaGastos_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_GASTOS);
  if (!hoja) hoja = libro.insertSheet(HOJA_GASTOS);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
    hoja.getRange('B:B').setNumberFormat('dd/MM/yyyy');
    hoja.getRange('F:F').setNumberFormat('#,##0.00');
    hoja.setColumnWidth(1, 120);
    hoja.setColumnWidth(4, 200);
    hoja.setColumnWidth(8, 240);
  }
  return hoja;
}

function leerGastos_() {
  var hoja = hojaGastos_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var filas = hoja.getRange(2, 1, ultima - 1, COLUMNAS.length).getValues();
  var zona = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var salida = [];
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (!f[0]) continue;
    salida.push({
      id: String(f[0]),
      fecha: comoFecha_(f[1], zona),
      establecimiento: String(f[2] || ''),
      proveedor: String(f[3] || ''),
      medioPago: String(f[4] || ''),
      monto: Number(f[5]) || 0,
      persona: String(f[6] || ''),
      nota: String(f[7] || ''),
      creado: f[8] instanceof Date ? f[8].toISOString() : String(f[8] || '')
    });
  }
  return salida;
}

function comoFecha_(valor, zona) {
  if (valor instanceof Date) return Utilities.formatDate(valor, zona, 'yyyy-MM-dd');
  var t = String(valor || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  var m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function guardarGasto_(g) {
  if (!g || !g.id) throw new Error('Falta el gasto o su ID.');
  var hoja = hojaGastos_();
  var valores = [
    String(g.id),
    g.fecha ? new Date(g.fecha + 'T12:00:00') : '',
    g.establecimiento || '',
    g.proveedor || '',
    g.medioPago || '',
    Number(g.monto) || 0,
    g.persona || '',
    g.nota || '',
    g.creado ? new Date(g.creado) : new Date(),
    new Date()
  ];
  var fila = buscarFila_(hoja, g.id);
  if (fila > 0) hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
  else hoja.appendRow(valores);
}

function borrarGasto_(id) {
  var hoja = hojaGastos_();
  var fila = buscarFila_(hoja, id);
  if (fila > 0) hoja.deleteRow(fila);
}

function buscarFila_(hoja, id) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return -1;
  var ids = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

/** Cambia un nombre en todos los gastos de una vez (proveedor o forma de pago). */
function renombrar_(campo, viejo, nuevo) {
  var columna = campo === 'proveedor' ? 4 : (campo === 'medioPago' ? 5 : 0);
  if (!columna || !viejo || !nuevo) return;
  var hoja = hojaGastos_();
  var ultima = hoja.getLastRow();
  if (ultima >= 2) {
    var rango = hoja.getRange(2, columna, ultima - 1, 1);
    var valores = rango.getValues();
    var cambio = false;
    for (var i = 0; i < valores.length; i++) {
      if (String(valores[i][0]) === String(viejo)) { valores[i][0] = nuevo; cambio = true; }
    }
    if (cambio) {
      rango.setValues(valores);
      hoja.getRange(2, 10, ultima - 1, 1).setValue(new Date());
    }
  }
  var listas = leerListas_();
  var clave = campo === 'proveedor' ? 'proveedores' : 'mediosPago';
  listas[clave] = listas[clave].map(function (x) { return x === viejo ? nuevo : x; });
  guardarListas_(listas.proveedores, listas.mediosPago);
}

/* ------------------------------------------------------------------ listas */

function hojaListas_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_LISTAS);
  if (!hoja) hoja = libro.insertSheet(HOJA_LISTAS);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(['Proveedores', 'Formas de pago']);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, 2).setFontWeight('bold');
    hoja.setColumnWidth(1, 240);
    hoja.setColumnWidth(2, 200);
  }
  return hoja;
}

function leerListas_() {
  var hoja = hojaListas_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return { proveedores: [], mediosPago: [] };
  var valores = hoja.getRange(2, 1, ultima - 1, 2).getValues();
  var provs = [], medios = [];
  for (var i = 0; i < valores.length; i++) {
    var a = String(valores[i][0] || '').trim();
    var b = String(valores[i][1] || '').trim();
    if (a) provs.push(a);
    if (b) medios.push(b);
  }
  return { proveedores: provs, mediosPago: medios };
}

function guardarListas_(proveedores, mediosPago) {
  var hoja = hojaListas_();
  var ultima = hoja.getLastRow();
  if (ultima > 1) hoja.getRange(2, 1, ultima - 1, 2).clearContent();

  var alto = Math.max(proveedores.length, mediosPago.length);
  if (alto === 0) return;
  var filas = [];
  for (var i = 0; i < alto; i++) {
    filas.push([proveedores[i] || '', mediosPago[i] || '']);
  }
  hoja.getRange(2, 1, alto, 2).setValues(filas);
}

/* ----------------------------------------------------------------- salida */

function responder_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
