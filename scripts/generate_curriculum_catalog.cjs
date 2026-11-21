const fs = require('fs');
const path = require('path');

const files = [
  'data/processed/chunks/cbse_chunks.json',
  'data/processed/chunks/isc_chunks.json',
  'data/processed/chunks/icse_chunks.json',
  'data/processed/chunks/west_bengal_board_(wbchse)_chunks.json'
];

let allChunks = [];
for (const f of files) {
  if (fs.existsSync(f)) {
    const list = JSON.parse(fs.readFileSync(f, 'utf8'));
    allChunks = allChunks.concat(list);
  }
}

// Filter chunks with meaningful content
const substantive = allChunks.filter(c => (c.content || '').trim().length >= 60);

const compact = substantive.map((c, idx) => {
  const subject = c.subject || 'Science';
  const grade = c.grade || 'Grade 10-12';
  const board = c.board || 'CBSE';
  
  let topic = (c.topic || c.chapter || subject).trim();
  // Clean up noisy topic strings
  topic = topic.replace(/^General\s*-\s*/i, '').replace(/\(Syllabus\)/i, '').trim();
  if (topic.length > 90) topic = topic.slice(0, 90) + '...';

  let title = `${subject}: ${topic}`;
  if (title.length > 100) title = title.slice(0, 100) + '...';

  let cleanSource = c.source || `${board} ${grade} ${subject}`;
  cleanSource = cleanSource.replace(/--- Page \d+ ---/g, '').replace(/\s+/g, ' ').trim();
  if (cleanSource.length > 90) cleanSource = cleanSource.slice(0, 90);

  const cleanContent = (c.content || '')
    .replace(/--- Page \d+ ---/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);

  return {
    id: c.id || `chunk-${idx}`,
    title,
    topic,
    chapter: c.chapter || 'Official Curriculum Standards',
    subject,
    grade,
    board,
    docType: c.docType || 'textbook',
    source: cleanSource,
    content: cleanContent
  };
});

const outDir = path.join(__dirname, '..', 'public', 'data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'curriculum_chunks.json');
fs.writeFileSync(outPath, JSON.stringify(compact));
const stats = fs.statSync(outPath);
console.log('Successfully wrote', compact.length, 'chunks to', outPath);
console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
