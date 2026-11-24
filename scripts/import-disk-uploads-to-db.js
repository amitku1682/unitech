#!/usr/bin/env node
/**
 * scripts/import-disk-uploads-to-db.js
 * 
 * Imports admin-uploaded files that exist ONLY on disk into PostgreSQL uploaded_files table.
 * Keeps the SAME filename / public URL.
 * Enforces magic-byte verification, allowed types (JPEG, PNG, WebP, PDF), and size limits.
 * Never deletes disk files. Runs inside container using plain Node.js.
 *
 * Usage:
 *   node scripts/import-disk-uploads-to-db.js [--source <folder>] [--dry-run]
 *   node scripts/import-disk-uploads-to-db.js [--source <folder>] --apply
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;    // 5 MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

function detectMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return 'unknown';

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf';
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'webp';
  }

  // Text check for SVG/XML/HTML/Script
  const sample = buffer.subarray(0, Math.min(1024, buffer.length)).toString('utf8').toLowerCase();
  if (
    sample.includes('<svg') ||
    sample.includes('<?xml') ||
    sample.includes('<html') ||
    sample.includes('<script') ||
    sample.includes('<!doctype')
  ) {
    return 'svg';
  }

  return 'unknown';
}

function getMimeType(type, ext) {
  switch (type) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default:
      if (ext === '.pdf') return 'application/pdf';
      if (ext === '.png') return 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
      if (ext === '.webp') return 'image/webp';
      return 'application/octet-stream';
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let isApply = false;
  let source = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') {
      isApply = true;
    } else if (args[i] === '--dry-run') {
      isApply = false;
    } else if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1];
      i++;
    }
  }

  return { isApply, source };
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^DATABASE_URL=(.+)$/m);
    if (match) return match[1].trim();
  }
  return 'postgres://unitech_admin:unitech_secure_local_dev_password_2026@localhost:5432/unitech_cctv_db';
}

function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.isFile()) {
      if (entry.name === '.gitkeep' || entry.name === '.DS_Store' || entry.name.startsWith('.')) {
        continue;
      }
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const { isApply, source } = parseArgs();
  console.log('========================================================================');
  console.log(`IMPORT DISK UPLOADS TO POSTGRESQL (${isApply ? 'APPLY MODE' : 'DRY-RUN MODE'})`);
  console.log('========================================================================\n');

  const dbUrl = getDatabaseUrl();
  const pool = new Pool({ connectionString: dbUrl });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');

    // Fetch existing filenames in uploaded_files
    const existingRes = await client.query('SELECT filename FROM uploaded_files');
    const existingFilenames = new Set(existingRes.rows.map(r => r.filename.toLowerCase()));
    console.log(`Existing records in uploaded_files: ${existingFilenames.size}`);

    // Gather candidate files
    let candidateFiles = [];
    if (source) {
      const resolvedSource = path.resolve(process.cwd(), source);
      console.log(`Scanning source folder: ${resolvedSource}`);
      candidateFiles = collectFiles(resolvedSource);
    } else {
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      const downloadsDir = path.resolve(process.cwd(), 'public', 'downloads');
      console.log(`Scanning default folders: ${uploadsDir} & ${downloadsDir}`);
      candidateFiles = [...collectFiles(uploadsDir), ...collectFiles(downloadsDir)];
    }

    console.log(`Found ${candidateFiles.length} candidate file(s) on disk.\n`);

    const summary = {
      total: candidateFiles.length,
      already_in_db: 0,
      imported: 0,
      would_import: 0,
      rejected_size: 0,
      rejected_type: 0,
      errors: 0,
    };

    for (const filePath of candidateFiles) {
      const filename = path.basename(filePath);
      const ext = path.extname(filename).toLowerCase();
      const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      // 1. Check if already in DB
      if (existingFilenames.has(cleanFilename) || existingFilenames.has(filename.toLowerCase())) {
        summary.already_in_db++;
        console.log(`  [ALREADY IN DB] ${filename} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
        continue;
      }

      // Read file buffer
      const buffer = fs.readFileSync(filePath);

      // 2. Magic byte check
      const detected = detectMagicBytes(buffer);
      if (detected === 'svg' || detected === 'unknown') {
        summary.rejected_type++;
        console.warn(`  [REJECTED TYPE] ${filename} - Magic bytes: ${detected}`);
        continue;
      }

      // 3. Size check
      const isDoc = detected === 'pdf' || ext === '.pdf';
      const maxAllowed = isDoc ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;
      if (fileSize > maxAllowed) {
        summary.rejected_size++;
        console.warn(`  [REJECTED SIZE] ${filename} - Size: ${fileSize} exceeds limit: ${maxAllowed}`);
        continue;
      }

      const mimeType = getMimeType(detected, ext);
      const sizeStr = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
      const fileId = `file-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      if (isApply) {
        await client.query(
          `INSERT INTO uploaded_files (id, filename, file_data, mime_type, file_size)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (filename) DO UPDATE SET
             file_data = EXCLUDED.file_data,
             mime_type = EXCLUDED.mime_type,
             file_size = EXCLUDED.file_size,
             created_at = CURRENT_TIMESTAMP`,
          [fileId, cleanFilename, buffer, mimeType, sizeStr]
        );
        existingFilenames.add(cleanFilename);
        summary.imported++;
        console.log(`  ✅ [IMPORTED] ${cleanFilename} (${mimeType}, ${sizeStr}) -> ID: ${fileId}`);
      } else {
        summary.would_import++;
        console.log(`  🔍 [WOULD IMPORT] ${cleanFilename} (${mimeType}, ${sizeStr})`);
      }
    }

    client.release();

    console.log('\n========================================================================');
    console.log('IMPORT SUMMARY:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('========================================================================');

    if (!isApply && summary.would_import > 0) {
      console.log('\nDry-run complete. Run with --apply to perform the database import.');
    } else if (isApply) {
      console.log('\nAll files successfully imported into PostgreSQL uploaded_files.');
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error during disk upload import:', err);
  process.exit(1);
});
