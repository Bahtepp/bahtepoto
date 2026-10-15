/**
 * Fark raporu (Markdown): yeni / değişen / çelişen kayıtlar, alan bazında kaynak bilgisi,
 * yer tutucular, uyarılar ve hatalar. Çıktı deterministiktir (çalıştırma zamanı yazılmaz);
 * aynı staging verisi her zaman aynı raporu üretir.
 */
import { analyze, type Analysis, type ChangeKind, type FieldChange, type RecordChange } from './analyze.ts';
import type { LoadedStagingFile, RawCatalog } from './io.ts';
import { promoteGate } from './promote.ts';

/**
 * Rapor için analiz: hata ve uyarılar her şey onaylanmış gibi yapılan denetimden; kayıtların
 * "yazılır / yazılmaz" durumu varsayılan promote kapısından (gerçekte ne yazılacağı).
 */
export function analyzeForReport(raw: RawCatalog, staging: LoadedStagingFile[]): Analysis {
  const check = analyze(raw, staging);
  return { ...analyze(raw, staging, { gate: promoteGate() }), errors: check.errors, warnings: check.warnings };
}

const KIND_TR: Record<ChangeKind, string> = {
  new: 'Yeni',
  changed: 'Değişen',
  conflicting: 'Çelişen',
  unchanged: 'Değişmeyen',
};
const TYPE_TR = { model: 'Model', generation: 'Nesil', source: 'Kaynak' } as const;
const ORIGIN_TR = { source: 'kaynak', derived: 'türetildi', editorial: 'yapılandırma', placeholder: '**YER TUTUCU**' } as const;

const cell = (v: unknown): string => {
  if (v === undefined) return '—';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return `\`${s.replace(/\|/g, '\\|').replace(/`/g, "'")}\``;
};
const text = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function origin(f: FieldChange): string {
  const p = f.provenance;
  if (!p) return '—';
  const parts: string[] = [ORIGIN_TR[p.kind]];
  if (p.sourceField) parts.push(`\`${p.sourceField}\``);
  if (p.retrievedAt) parts.push(p.retrievedAt);
  // Yer tutucu notları ayrı listede; burada yalnızca kaynak/türetme açıklaması.
  if (p.note && p.kind !== 'placeholder') parts.push(text(p.note));
  return parts.join(' · ');
}

function renderChange(c: RecordChange): string[] {
  const out = [`#### ${TYPE_TR[c.recordType]} \`${c.id}\` — ${KIND_TR[c.kind]}`, ''];
  out.push(`- Hedef: \`src/data/catalog/${c.target}\``);
  out.push(`- \`import:promote --write\`: ${c.applied ? 'yazılır' : `yazılmaz — ${c.skipReason ?? ''}`}`);
  out.push('');
  if (c.fields.length > 0) {
    const showBefore = c.kind !== 'new';
    out.push(showBefore ? '| Alan | Mevcut | Aday | Köken |' : '| Alan | Aday | Köken |');
    out.push(showBefore ? '|---|---|---|---|' : '|---|---|---|');
    for (const f of c.fields) {
      out.push(showBefore ? `| \`${f.path}\` | ${cell(f.before)} | ${cell(f.after)} | ${origin(f)} |` : `| \`${f.path}\` | ${cell(f.after)} | ${origin(f)} |`);
    }
    out.push('');
  }
  if (c.placeholders.length > 0) {
    out.push('**Kaynağa dayanmayan yer tutucular:**', '');
    for (const p of c.placeholders) out.push(`- \`${p.path}\`: ${text(p.note)}`);
    out.push('');
  }
  return out;
}

export function renderDiffReport(analysis: Analysis, adapter: string): string {
  const files = analysis.staging.filter((s) => s.path.startsWith(`${adapter}/`));
  const changes = analysis.changes.filter((c) => c.adapter === adapter);
  const targets = new Set(changes.map((c) => c.target));
  const mine = (m: string) => files.some((f) => m.includes(f.path)) || [...targets].some((t) => m.startsWith(`${t}:`));
  const foreign = (m: string) => analysis.staging.some((f) => m.includes(f.path));
  // Bu kaynağa ait mesajlar + hiçbir staging dosyasına bağlanamayan katalog geneli hatalar.
  const errors = analysis.errors.filter((e) => mine(e) || !foreign(e));
  const warnings = analysis.warnings.filter(mine);

  const count = (k: ChangeKind) => changes.filter((c) => c.kind === k).length;
  const out: string[] = [
    `# Fark raporu: ${adapter}`,
    '',
    '> Bu rapor `npm run import:diff` ile üretildi. Aday kayıtlar **henüz kataloğa yazılmadı**;',
    '> `npm run import:promote` varsayılan olarak yalnızca kuru çalıştırma yapar.',
    '',
    '## Özet',
    '',
    '| Yeni | Değişen | Çelişen | Değişmeyen | Hata | Uyarı |',
    '|---|---|---|---|---|---|',
    `| ${count('new')} | ${count('changed')} | ${count('conflicting')} | ${count('unchanged')} | ${errors.length} | ${warnings.length} |`,
    '',
  ];

  for (const f of files) {
    if (!f.file) continue;
    const l = f.file.license;
    out.push(`## \`data/staging/${f.path}\``, '');
    out.push(`- Kaynak: ${l.name} — lisans: [${l.license}](${l.licenseUrl}) — yayımlanabilir: ${l.publishable ? 'evet' : '**hayır**'}`);
    out.push(`- Atıf: ${text(l.attribution)}`);
    out.push(`- Ham verinin alındığı gün: ${f.file.retrievedAt}`);
    if (f.file.rawFiles.length > 0) out.push(`- Ham dosyalar (git dışı): ${f.file.rawFiles.map((r) => `\`.cache/import/${r}\``).join(', ')}`);
    out.push('');
    if (f.file.skipped.length > 0) {
      out.push('**Atlananlar:**', '');
      for (const s of f.file.skipped) out.push(`- \`${s.ref}\`: ${text(s.reason)}`);
      out.push('');
    }
    for (const kind of ['conflicting', 'new', 'changed', 'unchanged'] as const) {
      const list = changes.filter((c) => c.stagingPath === f.path && c.kind === kind);
      if (list.length === 0) continue;
      out.push(`### ${KIND_TR[kind]} kayıtlar (${list.length})`, '');
      if (kind === 'unchanged') {
        for (const c of list) out.push(`- ${TYPE_TR[c.recordType]} \`${c.id}\``);
        out.push('');
      } else for (const c of list) out.push(...renderChange(c));
    }
  }

  out.push('## Uyarılar', '');
  out.push(...(warnings.length ? warnings.map((w) => `- ${text(w)}`) : ['Yok.']), '');
  out.push('## Hatalar', '');
  out.push(...(errors.length ? errors.map((e) => `- ${text(e)}`) : ['Yok. Birleştirilmiş katalog şemaları ve bütünlük denetimini geçiyor.']), '');
  return out.join('\n');
}
