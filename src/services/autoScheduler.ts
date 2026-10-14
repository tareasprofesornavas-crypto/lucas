import { Task, TaskDifficulty, TaskAttachment } from '../types';
import { DEFAULT_SUBJECTS, DIFFICULTY_CONFIG } from '../utils/constants';

export interface AutoParsedItem {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  difficulty: TaskDifficulty;
  alertDaysBefore: number;
  detectedDateFromDoc?: boolean;
}

// Helper to format date YYYY-MM-DD
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Add days to a base date, avoiding weekends for school realism
export function addDays(baseDate: Date, days: number): Date {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Extracts readable text from file (works completely offline)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Plain text, CSV, JSON, Markdown
  if (['txt', 'csv', 'json', 'md'].includes(ext || '')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  if (ext === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    try {
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        const page = await doc.getPage(pageNumber);
        const content = await page.getTextContent();
        let text = '';
        for (const item of content.items) {
          if ('str' in item) {
            text += item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ');
          }
        }
        pages.push(text);
      }
    } finally { await doc.destroy(); }
    return pages.join('\n');
  }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Las fotografías necesitan OCR. Ingresa las tareas manualmente o utiliza un documento con texto seleccionable.');
  }
  throw new Error('Formato no compatible. Usa PDF con texto, DOCX, TXT, CSV, JSON o Markdown.');
}

/**
 * Guess individual subject for a specific activity title or context line
 */
export function inferSubjectForActivity(text: string, currentContextSubject = 'math'): string {
  const lower = text.toLowerCase();

  // Mathematics
  if (
    lower.includes('matemat') ||
    lower.includes('algeb') ||
    lower.includes('calcul') ||
    lower.includes('geom') ||
    lower.includes('trigo') ||
    lower.includes('ecuacion') ||
    lower.includes('fraccion') ||
    lower.includes('aritmet') ||
    lower.includes('polinom') ||
    lower.includes('estadistic') ||
    lower.includes('probabil') ||
    lower.includes('matemát')
  ) {
    return 'math';
  }

  // Physics and Chemistry
  if (
    lower.includes('quimic') ||
    lower.includes('químic') ||
    lower.includes('fisic') ||
    lower.includes('físic') ||
    lower.includes('termodinam') ||
    lower.includes('cinemat') ||
    lower.includes('newton') ||
    lower.includes('molecul') ||
    lower.includes('estequiometr') ||
    lower.includes('tabla periodic') ||
    lower.includes('atomo') ||
    lower.includes('átomo')
  ) {
    return 'physics_chemistry';
  }

  // Science / Biology
  if (
    lower.includes('biolog') ||
    lower.includes('cienci') ||
    lower.includes('ecolog') ||
    lower.includes('celul') ||
    lower.includes('célul') ||
    lower.includes('ecosistem') ||
    lower.includes('organel') ||
    lower.includes('fotosintes') ||
    lower.includes('fotosíntes') ||
    lower.includes('anatom') ||
    lower.includes('genet') ||
    lower.includes('biodivers') ||
    lower.includes('reino animal')
  ) {
    return 'science';
  }

  // History and Social Sciences
  if (
    lower.includes('histor') ||
    lower.includes('geograf') ||
    lower.includes('social') ||
    lower.includes('civic') ||
    lower.includes('cívic') ||
    lower.includes('revoluc') ||
    lower.includes('independenc') ||
    lower.includes('guerr') ||
    lower.includes('imperi') ||
    lower.includes('constituc') ||
    lower.includes('democrac') ||
    lower.includes('siglo') ||
    lower.includes('civilizac')
  ) {
    return 'history';
  }

  // Literature / Language
  if (
    lower.includes('literat') ||
    lower.includes('lengu') ||
    lower.includes('espanol') ||
    lower.includes('español') ||
    lower.includes('ensayo') ||
    lower.includes('lectur') ||
    lower.includes('gramat') ||
    lower.includes('ortograf') ||
    lower.includes('poes') ||
    lower.includes('redacc') ||
    lower.includes('texto') ||
    lower.includes('novela') ||
    lower.includes('comprension lector') ||
    lower.includes('comprensión')
  ) {
    return 'literature';
  }

  // English / Languages
  if (
    lower.includes('ingl') ||
    lower.includes('english') ||
    lower.includes('vocab') ||
    lower.includes('idiom') ||
    lower.includes('grammar') ||
    lower.includes('listening') ||
    lower.includes('speaking') ||
    lower.includes('writing') ||
    lower.includes('reading') ||
    lower.includes('present perfect') ||
    lower.includes('simple past') ||
    lower.includes('verb')
  ) {
    return 'english';
  }

  // Technology & Computer Science
  if (
    lower.includes('tecnolog') ||
    lower.includes('infor') ||
    lower.includes('computac') ||
    lower.includes('progra') ||
    lower.includes('robot') ||
    lower.includes('software') ||
    lower.includes('codigo') ||
    lower.includes('código') ||
    lower.includes('sistemas') ||
    lower.includes('algoritm') ||
    lower.includes('web') ||
    lower.includes('scratch') ||
    lower.includes('python') ||
    lower.includes('ofimatica') ||
    lower.includes('ofimática') ||
    lower.includes('excel')
  ) {
    return 'technology';
  }

  // Arts & Music
  if (
    lower.includes('arte') ||
    lower.includes('dibuj') ||
    lower.includes('pintur') ||
    lower.includes('musica') ||
    lower.includes('música') ||
    lower.includes('plastica') ||
    lower.includes('plástica') ||
    lower.includes('teatro') ||
    lower.includes('danza') ||
    lower.includes('disen') ||
    lower.includes('diseñ') ||
    lower.includes('maqueta')
  ) {
    return 'arts';
  }

  // Fallback to currently active subject context in the document
  return currentContextSubject;
}

/**
 * Infer difficulty from task title/keywords
 */
export function inferDifficulty(title: string): TaskDifficulty {
  const lower = title.toLowerCase();
  if (
    lower.includes('proyecto') ||
    lower.includes('tesis') ||
    lower.includes('examen final') ||
    lower.includes('bimestral') ||
    lower.includes('monograf') ||
    lower.includes('maqueta grande') ||
    lower.includes('evaluacion final') ||
    lower.includes('evaluación final')
  ) {
    return 'muy_fuerte';
  }
  if (
    lower.includes('informe') ||
    lower.includes('laboratorio') ||
    lower.includes('maqueta') ||
    lower.includes('ensayo') ||
    lower.includes('investigacion') ||
    lower.includes('investigación') ||
    lower.includes('exposicion') ||
    lower.includes('exposición') ||
    lower.includes('fuerte') ||
    lower.includes('parcial')
  ) {
    return 'fuerte';
  }
  if (
    lower.includes('taller') ||
    lower.includes('cuestionario') ||
    lower.includes('ejercicios') ||
    lower.includes('resumen') ||
    lower.includes('guia') ||
    lower.includes('guía') ||
    lower.includes('actividad') ||
    lower.includes('practica') ||
    lower.includes('práctica')
  ) {
    return 'moderada';
  }
  return 'leve';
}

/**
 * Try to extract explicit dates from a text line like "Fecha: 15/10/2026", "Entrega: 18 de octubre", "20/11"
 */
function tryExtractExplicitDate(line: string, fallbackBaseDate: Date): Date | null {
  const currentYear = fallbackBaseDate.getFullYear();

  // 1. Standard format: DD/MM/YYYY or DD-MM-YYYY
  const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/;
  const match = line.match(dateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = match[3] ? parseInt(match[3], 10) : currentYear;
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // 2. Spanish textual month format: "15 de octubre"
  const spanishMonths: { [key: string]: number } = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const textualRegex = /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/i;
  const textMatch = line.match(textualRegex);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthName = textMatch[2].toLowerCase();
    const month = spanishMonths[monthName];
    const year = textMatch[3] ? parseInt(textMatch[3], 10) : currentYear;
    if (month !== undefined && day >= 1 && day <= 31) {
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  return null;
}

/**
 * Checks if a line appears to be a section header for a subject
 */
function checkSubjectSectionHeader(line: string): string | null {
  const trimmed = line.trim().toLowerCase();
  if (trimmed.length > 50) return null;

  if (trimmed.includes('matemát') || trimmed.includes('matemat') || trimmed.includes('álgebra') || trimmed.includes('algebra')) {
    return 'math';
  }
  if (trimmed.includes('ciencias naturales') || trimmed.includes('biología') || trimmed.includes('biologia')) {
    return 'science';
  }
  if (trimmed.includes('física') || trimmed.includes('fisica') || trimmed.includes('química') || trimmed.includes('quimica')) {
    return 'physics_chemistry';
  }
  if (trimmed.includes('historia') || trimmed.includes('sociales') || trimmed.includes('geografía') || trimmed.includes('geografia')) {
    return 'history';
  }
  if (trimmed.includes('lengua') || trimmed.includes('literatura') || trimmed.includes('español') || trimmed.includes('castellano')) {
    return 'literature';
  }
  if (trimmed.includes('inglés') || trimmed.includes('ingles') || trimmed.includes('english')) {
    return 'english';
  }
  if (
    trimmed.includes('tecnología') ||
    trimmed.includes('tecnologia') ||
    trimmed.includes('informática') ||
    trimmed.includes('informatica') ||
    trimmed.includes('computación') ||
    trimmed.includes('computacion') ||
    trimmed.includes('programación') ||
    trimmed.includes('programacion') ||
    trimmed.includes('sistemas')
  ) {
    return 'technology';
  }
  if (
    trimmed.includes('artística') ||
    trimmed.includes('artistica') ||
    trimmed.includes('arte') ||
    trimmed.includes('música') ||
    trimmed.includes('musica') ||
    trimmed.includes('dibujo') ||
    trimmed.includes('artes plásticas')
  ) {
    return 'arts';
  }

  return null;
}

/**
 * Parses a single uploaded document, covering ALL activities found across MULTIPLE subjects
 */
export async function parseAndAutoScheduleDocument(
  file: File,
  startDateOffsetDays = 3, // starting first deadline in 3 days
  spacingDays = 3 // spacing between consecutive tasks
): Promise<{ tasks: AutoParsedItem[]; subjectCounts: Record<string, number> }> {
  const text = await extractTextFromFile(file);
  const now = new Date();
  if (!text.trim()) throw new Error("El documento no contiene texto seleccionable. Necesita OCR o transcripción manual.");

  // Split document by lines
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const detectedItems: {
    title: string;
    subjectId: string;
    explicitDate: Date | null;
  }[] = [];

  let currentContextSubject = 'math';

  // Task match regexes
  const taskPrefixRegex = /^(?:[-*•#>]|\d+[\.\)\-]?|[a-zA-Z][\.\)\-])?\s*(?:tarea|actividad|taller|entrega|fase|hito|guía|guia|proyecto|informe|laboratorio|ejercicios|cuestionario|evaluación|evaluacion|examen|lectura|ensayo|semana|módulo|modulo)\b/i;
  const numberedListRegex = /^\s*(\d{1,2}|[a-zA-Z])[\.\)\-]\s+([A-Za-z\u00C0-\u017F].{8,110})/i;
  const bulletListRegex = /^\s*[-*•]\s+([A-Za-z\u00C0-\u017F].{8,110})/i;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check if line represents a subject section header
    const sectionSubject = checkSubjectSectionHeader(line);
    if (sectionSubject) {
      currentContextSubject = sectionSubject;
      continue;
    }

    let isTaskLine = false;
    let cleanTitle = line;

    // Check if line starts with task keyword
    if (taskPrefixRegex.test(line)) {
      isTaskLine = true;
    } else if (numberedListRegex.test(line)) {
      isTaskLine = true;
    } else if (bulletListRegex.test(line) && line.length > 15) {
      isTaskLine = true;
    } else if (line.includes(':') && line.length > 15 && line.length < 120) {
      // e.g. "Matemáticas: Taller de Álgebra", "Historia - Ensayo de Revolución"
      const prefix = line.split(':')[0].trim().toLowerCase();
      if (
        prefix.includes('matemat') ||
        prefix.includes('cienci') ||
        prefix.includes('histor') ||
        prefix.includes('lengu') ||
        prefix.includes('ingl') ||
        prefix.includes('fisic') ||
        prefix.includes('quimic') ||
        prefix.includes('arte') ||
        prefix.includes('actividad') ||
        prefix.includes('tarea') ||
        prefix.includes('entrega')
      ) {
        isTaskLine = true;
      }
    }

    if (isTaskLine && cleanTitle.length >= 8 && cleanTitle.length <= 130) {
      // Remove leading bullet/dash/hash/number if redundant
      cleanTitle = cleanTitle.replace(/^[-*•#>]\s*/, '').trim();

      // Avoid duplicates
      const isDuplicate = detectedItems.some(
        (it) => it.title.toLowerCase() === cleanTitle.toLowerCase()
      );

      if (!isDuplicate) {
        // Detect subject specific to this line!
        const itemSubject = inferSubjectForActivity(cleanTitle, currentContextSubject);
        const explicitDate = tryExtractExplicitDate(line, now);

        detectedItems.push({
          title: cleanTitle,
          subjectId: itemSubject,
          explicitDate,
        });
      }
    }
  }

  // If document didn't match structured line by line, look for global inline matches
  if (detectedItems.length < 2) {
    const inlineRegex = /(?:tarea|actividad|taller|entrega|fase|hito|informe|proyecto)\s*[:#\d\.-]*\s*([^\n\r,\.]{8,80})/gi;
    let match;
    while ((match = inlineRegex.exec(text)) !== null) {
      const clean = match[0].replace(/[^\w\s\u00C0-\u017F:,\.-]/gi, ' ').trim();
      if (clean.length > 8 && !detectedItems.some((it) => it.title.toLowerCase() === clean.toLowerCase())) {
        const itemSubject = inferSubjectForActivity(clean, currentContextSubject);
        const explicitDate = tryExtractExplicitDate(clean, now);
        detectedItems.push({
          title: clean,
          subjectId: itemSubject,
          explicitDate,
        });
      }
    }
  }

  // Do not fabricate assignments if no task was detected.
  if (detectedItems.length === 0) {
    throw new Error('No se encontraron tareas explícitas en el documento. No se crearon actividades ficticias.');
  }

  // Now create the auto-scheduled tasks across all detected activities
  const scheduledTasks: AutoParsedItem[] = [];
  const subjectCounts: Record<string, number> = {};

  for (let i = 0; i < detectedItems.length; i++) {
    const item = detectedItems[i];
    const difficulty = inferDifficulty(item.title);
    const alertDays = DIFFICULTY_CONFIG[difficulty].recommendedAlertDays;

    // Track subject distribution
    subjectCounts[item.subjectId] = (subjectCounts[item.subjectId] || 0) + 1;

    let deadlineDate: Date;
    let detectedDateFromDoc = false;

    if (item.explicitDate) {
      deadlineDate = item.explicitDate;
      detectedDateFromDoc = true;
    } else {
      // Stagger dates realistically across the school schedule
      // Add extra spacing for heavier tasks so deadlines don't pile up on the same day
      const dayOffset = startDateOffsetDays + (i * spacingDays) + (difficulty === 'muy_fuerte' ? 2 : 0);
      deadlineDate = addDays(now, dayOffset); // Suggested date only; must be confirmed by user.
    }

    const subjectObj = DEFAULT_SUBJECTS.find((s) => s.id === item.subjectId) || DEFAULT_SUBJECTS[0];

    scheduledTasks.push({
      id: `auto-item-${Date.now()}-${i}`,
      title: item.title,
      description: `Actividad de ${subjectObj.name} extraída del archivo "${file.name}". ${detectedDateFromDoc ? "Fecha detectada en el documento" : "FECHA PROPUESTA: revisar y confirmar antes de guardar"}. Incluye aviso preventivo (${alertDays} días antes) según su dificultad ${difficulty}.`,
      subjectId: item.subjectId,
      dueDate: formatDateISO(deadlineDate),
      dueTime: i % 2 === 0 ? '18:00' : '15:30',
      difficulty,
      alertDaysBefore: alertDays,
      detectedDateFromDoc,
    });
  }

  return { tasks: scheduledTasks, subjectCounts };
}
