/**
 * Грубая автоматическая разметка тем по ключевым словам (испанский текст).
 * Нужна только как отправная точка: темы потом правятся в админке (/admin/topics и в карточке вопроса).
 * Порядок правил важен — срабатывает первое совпадение.
 */
const RULES: [string, RegExp][] = [
  ['alcohol-drogas', /alcohol|tasa de|drog|medicament|estupefaciente|sustancias/i],
  ['primeros-auxilios', /herid|auxilio|víctima|socorr|incendio|inconsciente|hemorragia|desfibrilad|\bPAS\b|accidentad/i],
  ['sri-cinturon-casco', /cintur[oó]n|retenci[oó]n infantil|\bSRI\b|casco|estatura|silla infantil|airbag/i],
  ['adelantamiento', /adelant/i],
  ['velocidad', /velocidad|km\/h|distancia de (seguridad|frenado|detenci)/i],
  ['autopista-autovia', /autopista|autov[ií]a|v[ií]a para autom[oó]viles/i],
  ['estacionamiento', /estacion|aparc|parada|detener|inmoviliz|marcha atr[aá]s/i],
  ['luces', /\bluz\b|\bluces\b|alumbrado|\bfaros?\b|niebla|deslumbr|\bcruce\b.*luces/i],
  ['documentacion', /permiso|licencia|puntos|documentaci[oó]n|seguro obligatorio|\bITV\b|inspecci[oó]n t[eé]cnica|carn[eé]|matr[ií]cula|distintivo/i],
  ['mecanica', /neum[aá]tic|freno|aceite|motor|bater[ií]a|amortigua|direcci[oó]n asistida|refriger|mantenimiento|desgaste|presi[oó]n|embrague|\bABS\b|\bESP\b|carrocer[ií]a|escape/i],
  ['conduccion-eficiente', /consumo|combustible|contamin|medioambient|ambiental|eficiente|emisi[oó]n|ecol[oó]gic/i],
  ['factores-riesgo', /fatiga|cansancio|sue[ñn]o|distracc|m[oó]vil|tel[eé]fono|somnolen|estr[eé]s|atenci[oó]n al conducir|reflejos/i],
  ['peatones-ciclistas', /ciclista|bicicleta|peat[oó]n|peatones|motorista|ciclomotor|patinete|motocicleta|animales/i],
  ['prioridad-cruces', /preferencia|ceder el paso|prioridad|intersecci[oó]n|cruce|glorieta|rotonda|paso a nivel|tranv[ií]a/i],
  ['maniobras', /cambio de sentido|giro|girar|incorpor|carril|cambiar de direcci[oó]n|maniobra|circular por/i],
  ['carga-remolques', /remolque|carga|\bMMA\b|masa m[aá]xima|pasajeros|mercanc[ií]a|caravana|ocupantes/i],
  ['senales', /se[ñn]al|panel|marca vial|sem[aá]foro|agente|indica|obliga|prohib/i],
];

export function guessTopic(text: string, options: string[], imageFile: string | null): string {
  const t = text;
  // вопросы «что означает этот знак» — по картинке и формулировке
  if (/^¿?qu[eé] (indica|significa|prohíbe|proh[ií]be|obliga|advierte)|estas? se[ñn]ales?|esta se[ñn]al|el panel/i.test(t) && imageFile) return 'senales';
  for (const [topic, re] of RULES) if (re.test(t)) return topic;
  for (const [topic, re] of RULES) if (options.some((o) => re.test(o))) return topic;
  return 'general';
}
