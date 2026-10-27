/**
 * =========================================================================
 * LUDOSPORT ARENA - GOOGLE APPS SCRIPT BACKEND API
 * =========================================================================
 * Este script se aloja directamente en tu Google Sheet para funcionar como
 * una API REST gratuita y ligera para persistir tiradores y combates mensuales.
 *
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En Google Drive, crea una hoja de cálculo llamada "LudoSport Liga Mensual".
 * 2. En el menú superior: Extensiones > Apps Script.
 * 3. Borra el código existente y pega TODO el contenido de este archivo.
 * 4. Guarda con Ctrl + S.
 * 5. Haz clic en el botón azul superior: "Implementar" (Deploy) > "Nueva implementación" (New deployment).
 * 6. Haz clic en el engranaje a la izquierda de "Seleccionar tipo" > Elige "Aplicación web".
 * 7. Configura:
 *    - Descripción: "LudoSport API v1"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)  <--- ¡MUY IMPORTANTE!
 * 8. Haz clic en "Implementar" y autoriza los permisos si te lo solicita.
 * 9. Copia la URL de la aplicación web (termina en /exec) y pégala en los
 *    Ajustes de la Web App en tu teléfono u ordenador.
 * =========================================================================
 */

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse({ success: true, message: 'LudoSport Arena API activa' });
    }

    if (action === 'getData') {
      var monthKey = params.monthKey;
      if (!monthKey) {
        return jsonResponse({ success: false, error: 'Falta parámetro monthKey (ej: 102026)' });
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var fencers = getOrCreateFencersSheet(ss);
      var matches = getOrCreateMatchesSheet(ss, monthKey);

      return jsonResponse({
        success: true,
        monthKey: monthKey,
        fencers: fencers,
        matches: matches
      });
    }

    return jsonResponse({ success: false, error: 'Acción GET desconocida' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      return jsonResponse({ success: false, error: 'Cuerpo de solicitud vacío' });
    }

    var data = JSON.parse(contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Guardar o registrar un nuevo combate
    if (action === 'saveMatch') {
      var monthKey = data.monthKey;
      var match = data.match;

      if (!monthKey || !match) {
        return jsonResponse({ success: false, error: 'Faltan datos de combate' });
      }

      var sheet = getSheetOrCreate(ss, monthKey, [
        'ID', 'Fecha', 'Tirador A ID', 'Tirador A', 'Tirador B ID', 'Tirador B',
        'Resultado', 'Puntos A', 'Puntos B', 'Ganador', 'Detalle', 'Timestamp',
        'Score A', 'Score B', 'Marcador'
      ]);

      sheet.appendRow([
        match.id,
        match.date,
        match.fighterAId,
        match.fighterAName,
        match.fighterBId,
        match.fighterBName,
        match.result,
        match.pointsA,
        match.pointsB,
        match.winner,
        match.notes || '',
        match.timestamp || new Date().toISOString(),
        match.scoreA !== undefined ? match.scoreA : 0,
        match.scoreB !== undefined ? match.scoreB : 0,
        match.scoreText || ((match.scoreA || 0) + ' - ' + (match.scoreB || 0))
      ]);

      return jsonResponse({ success: true, message: 'Combate guardado correctamente' });
    }

    // 2. Eliminar un combate individual
    if (action === 'deleteMatch') {
      var monthKey = data.monthKey;
      var matchId = data.matchId;
      var sheet = ss.getSheetByName(monthKey);

      if (!sheet) {
        return jsonResponse({ success: false, error: 'Hoja de mes no encontrada' });
      }

      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == matchId) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true, message: 'Combate eliminado correctamente' });
        }
      }

      return jsonResponse({ success: false, message: 'Combate no encontrado' });
    }

    // 3. Resetear o limpiar todos los combates del mes activo
    if (action === 'resetMonth') {
      var monthKey = data.monthKey;
      if (!monthKey) {
        return jsonResponse({ success: false, error: 'Falta parámetro monthKey' });
      }
      var sheet = ss.getSheetByName(monthKey);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          // Limpia todas las filas de combates manteniendo la fila de encabezados
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }
      }
      return jsonResponse({ success: true, message: 'Hoja del mes reseteada correctamente' });
    }

    // 4. Guardar lista completa de tiradores
    if (action === 'saveFencersList') {
      var fencers = data.fencers || [];
      var fencerSheet = getSheetOrCreate(ss, 'Tiradores', ['ID', 'Nombre', 'Rango', 'Color Sable', 'Fecha Alta']);

      // Limpiar datos existentes (preservando cabecera)
      var lastRow = fencerSheet.getLastRow();
      if (lastRow > 1) {
        fencerSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      }

      if (fencers.length > 0) {
        var rowsToAdd = fencers.map(function(f) {
          return [f.id, f.name, f.rank || 'Iniciado', f.color || 'cyan', f.joinedAt || new Date().toISOString()];
        });
        fencerSheet.getRange(2, 1, rowsToAdd.length, 5).setValues(rowsToAdd);
      }

      return jsonResponse({ success: true, message: 'Lista de tiradores actualizada' });
    }

    return jsonResponse({ success: false, error: 'Acción POST no reconocida' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ==========================================
// HELPERS
// ==========================================

function getSheetOrCreate(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Dar formato elegante a la cabecera
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#00e5ff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateFencersSheet(ss) {
  var sheet = getSheetOrCreate(ss, 'Tiradores', ['ID', 'Nombre', 'Rango', 'Color Sable', 'Fecha Alta']);
  var data = sheet.getDataRange().getValues();
  var fencers = [];

  // Si la hoja solo tiene cabecera, sembramos alumnos iniciales
  if (data.length <= 1) {
    var defaults = [
      ['f-1', 'Marco Silva', 'Avanzado', 'cyan', '2026-01-10'],
      ['f-2', 'Elena Rostova', 'Intermedio', 'emerald', '2026-02-15'],
      ['f-3', 'David Kenobi', 'Avanzado', 'amber', '2026-01-20'],
      ['f-4', 'Sara Vane', 'Iniciado', 'purple', '2026-03-01'],
      ['f-5', 'Alex Vance', 'Intermedio', 'cyan', '2026-02-10'],
      ['f-6', 'Lucas Corvo', 'Iniciado', 'rose', '2026-03-05'],
      ['f-7', 'Nuria Soler', 'Avanzado', 'white', '2026-01-12'],
      ['f-8', 'Pablo Ruiz', 'Iniciado', 'amber', '2026-03-12']
    ];
    sheet.getRange(2, 1, defaults.length, 5).setValues(defaults);
    data = sheet.getDataRange().getValues();
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] && row[1]) {
      fencers.push({
        id: String(row[0]),
        name: String(row[1]),
        rank: String(row[2] || 'Iniciado'),
        color: String(row[3] || 'cyan'),
        joinedAt: String(row[4] || '')
      });
    }
  }

  return fencers;
}

function getOrCreateMatchesSheet(ss, monthKey) {
  var sheet = getSheetOrCreate(ss, monthKey, [
    'ID', 'Fecha', 'Tirador A ID', 'Tirador A', 'Tirador B ID', 'Tirador B',
    'Resultado', 'Puntos A', 'Puntos B', 'Ganador', 'Detalle', 'Timestamp'
  ]);
  var data = sheet.getDataRange().getValues();
  var matches = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) {
      matches.push({
        id: String(row[0]),
        date: formatDateString(row[1]),
        fighterAId: String(row[2]),
        fighterAName: String(row[3]),
        fighterBId: String(row[4]),
        fighterBName: String(row[5]),
        result: String(row[6]),
        pointsA: Number(row[7]),
        pointsB: Number(row[8]),
        winner: String(row[9]),
        notes: String(row[10] || ''),
        timestamp: String(row[11] || ''),
        scoreA: (row[12] !== undefined && row[12] !== '') ? Number(row[12]) : (row[6] === 'VICTORY_A' ? 1 : 0),
        scoreB: (row[13] !== undefined && row[13] !== '') ? Number(row[13]) : (row[6] === 'VICTORY_B' ? 1 : 0),
        scoreText: String(row[14] || '')
      });
    }
  }

  // Devolver del más reciente al más antiguo
  return matches.reverse();
}

function formatDateString(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(val || '');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
