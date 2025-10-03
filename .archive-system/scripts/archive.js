#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ArchiveManager {
  constructor() {
    this.config = require('../config.json');
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.archiveRoot = path.join(this.projectRoot, this.config.archiveRoot);
  }

  async getGitInfo(sourcePath) {
    try {
      const { stdout: commit } = await execPromise(`git log -1 --format=%H -- ${sourcePath}`);
      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD');
      const { stdout: tags } = await execPromise(`git tag --points-at HEAD`);
      
      return {
        commit: commit.trim(),
        branch: branch.trim(),
        tags: tags.trim().split('\n').filter(t => t)
      };
    } catch (error) {
      return { commit: 'unknown', branch: 'unknown', tags: [] };
    }
  }

  async archive(sourcePath, options = {}) {
    const {
      reason = 'archived',
      category = 'general',
      name = path.basename(sourcePath)
    } = options;

    // Validate source exists
    if (!await fs.pathExists(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // Generate archive path
    const now = new Date();
    const year = now.getFullYear();
    const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const timestamp = now.toISOString().split('T')[0];
    const folderName = `${timestamp}_${name.replace(/[^a-z0-9-]/gi, '-')}`;
    
    const archivePath = path.join(
      this.archiveRoot,
      year.toString(),
      quarter,
      folderName
    );

    // Create archive directory
    await fs.ensureDir(archivePath);
    console.log(`📁 Creating archive at: ${archivePath}`);

    // Copy files
    const filesPath = path.join(archivePath, 'files');
    await fs.copy(sourcePath, filesPath);
    console.log(`✓ Copied files from: ${sourcePath}`);

    // Get Git information
    const gitInfo = await this.getGitInfo(sourcePath);

    // Create metadata
    const metadata = {
      archiveId: `${timestamp}-${Date.now()}`,
      timestamp: now.toISOString(),
      archivedBy: process.env.USER || 'unknown',
      source: {
        path: path.relative(this.projectRoot, sourcePath),
        gitCommit: gitInfo.commit,
        gitBranch: gitInfo.branch,
        gitTags: gitInfo.tags
      },
      metadata: {
        name,
        type: options.type || 'code',
        reason,
        category
      }
    };

    await fs.writeJSON(
      path.join(archivePath, 'metadata.json'),
      metadata,
      { spaces: 2 }
    );
    console.log(`✓ Created metadata.json`);

    // Copy README template and customize
    const templatePath = path.join(this.archiveRoot, 'templates', 'README-template.md');
    const readmePath = path.join(archivePath, 'README.md');
    
    if (await fs.pathExists(templatePath)) {
      let readme = await fs.readFile(templatePath, 'utf8');
      readme = readme
        .replace('[Feature/Component Name]', name)
        .replace('YYYY-MM-DD', timestamp)
        .replace('[Your Name/Team]', process.env.USER || 'Unknown')
        .replace('path/to/original/files', metadata.source.path)
        .replace('abc123def', gitInfo.commit.substring(0, 7));
      
      await fs.writeFile(readmePath, readme);
      console.log(`✓ Created README.md (please edit with specific details)`);
    }

    // Log archive action
    await this.logArchive(metadata);

    console.log(`\n✅ Archive created successfully!`);
    console.log(`📍 Location: ${path.relative(this.projectRoot, archivePath)}`);
    console.log(`📝 Next step: Edit ${path.join(folderName, 'README.md')} with specific details\n`);

    return archivePath;
  }

  async logArchive(metadata) {
    const logPath = path.join(this.projectRoot, '.archive-system', 'archive-log.json');
    let logs = [];
    
    if (await fs.pathExists(logPath)) {
      logs = await fs.readJSON(logPath);
    }
    
    logs.push(metadata);
    await fs.writeJSON(logPath, logs, { spaces: 2 });
  }

  async search(query) {
    const logPath = path.join(this.projectRoot, '.archive-system', 'archive-log.json');
    
    if (!await fs.pathExists(logPath)) {
      console.log('No archives found.');
      return [];
    }

    const logs = await fs.readJSON(logPath);
    const results = logs.filter(log => 
      log.metadata.name.toLowerCase().includes(query.toLowerCase()) ||
      log.metadata.reason.toLowerCase().includes(query.toLowerCase()) ||
      log.source.path.toLowerCase().includes(query.toLowerCase())
    );

    return results;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new ArchiveManager();

  if (args[0] === 'search') {
    manager.search(args[1] || '').then(results => {
      console.log(`\nFound ${results.length} archive(s):\n`);
      results.forEach(r => {
        console.log(`📦 ${r.metadata.name}`);
        console.log(`   Path: ${r.source.path}`);
        console.log(`   Date: ${r.timestamp.split('T')[0]}`);
        console.log(`   Reason: ${r.metadata.reason}\n`);
      });
    });
  } else {
    const sourcePath = args[0];
    const options = {
      reason: args[1] || 'archived',
      name: args[2] || path.basename(sourcePath),
      category: args[3] || 'general'
    };

    if (!sourcePath) {
      console.log(`
Usage: 
  node archive.js <source-path> [reason] [name] [category]
  node archive.js search <query>

Examples:
  node archive.js ./old-api "replaced by v2" "Legacy API" "backend"
  node archive.js search "legacy"
      `);
      process.exit(1);
    }

    manager.archive(sourcePath, options).catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
  }
}

module.exports = ArchiveManager;
