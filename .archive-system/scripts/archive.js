#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const util = require('util');
const { exec } = require('child_process');

const execPromise = util.promisify(exec);

const CONFIG_PATH = path.resolve(__dirname, '../config.json');
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ARCHIVE_LOG_PATH = path.resolve(PROJECT_ROOT, '.archive-system/archive-log.json');

async function readJson(filePath) {
  const data = await fsp.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, JSON.stringify(value, null, 2));
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function pathExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

class ArchiveManager {
  constructor() {
    this.config = null;
  }

  async loadConfig() {
    if (this.config) {
      return this.config;
    }

    if (!(await pathExists(CONFIG_PATH))) {
      throw new Error('Archive configuration file not found.');
    }

    this.config = await readJson(CONFIG_PATH);

    if (!this.config.archiveRoot) {
      throw new Error('archiveRoot missing from configuration.');
    }

    this.archiveRoot = path.resolve(PROJECT_ROOT, this.config.archiveRoot);
    return this.config;
  }

  // Retrieve git metadata for the archived content to preserve history.
  async getGitInfo(sourcePath) {
    try {
      const { stdout: commit } = await execPromise(`git log -1 --format=%H -- ${sourcePath}`);
      const { stdout: branch } = await execPromise('git rev-parse --abbrev-ref HEAD');
      const { stdout: tags } = await execPromise('git tag --points-at HEAD');

      return {
        commit: commit.trim(),
        branch: branch.trim(),
        tags: tags.trim().split('\n').filter(Boolean),
      };
    } catch (error) {
      // When the path has not yet been committed, fall back to neutral metadata.
      return { commit: 'untracked', branch: 'unknown', tags: [] };
    }
  }

  // Copy the target path into the archive and write associated metadata.
  async archive(sourcePath, options = {}) {
    await this.loadConfig();

    const resolvedSource = path.resolve(PROJECT_ROOT, sourcePath);

    if (!(await pathExists(resolvedSource))) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const stats = await fsp.stat(resolvedSource);
    if (!stats.isDirectory() && !stats.isFile()) {
      throw new Error('Source path must be a file or directory.');
    }

    const now = new Date();
    const year = now.getFullYear();
    const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const timestamp = now.toISOString().split('T')[0];
    const sanitizedName = (options.name || path.basename(resolvedSource)).replace(/[^a-z0-9-]+/gi, '-');
    const folderName = `${timestamp}_${sanitizedName}`;
    const archiveDestination = path.join(this.archiveRoot, String(year), quarter, folderName);

    await ensureDir(archiveDestination);

    const filesDestination = path.join(archiveDestination, 'files');

    // fs.cp handles both directories and files recursively.
    await fsp.cp(resolvedSource, filesDestination, { recursive: true });

    const gitInfo = await this.getGitInfo(resolvedSource);
    const metadata = await this.buildMetadata({
      now,
      sourcePath: resolvedSource,
      reason: options.reason,
      type: options.type,
      category: options.category,
      gitInfo,
    });

    await writeJson(path.join(archiveDestination, 'metadata.json'), metadata);
    await this.createReadme({ archiveDestination, metadata, timestamp, gitInfo, name: sanitizedName });
    await this.appendLog(metadata);

    return archiveDestination;
  }

  async buildMetadata({ now, sourcePath, reason, type, category, gitInfo }) {
    const relativeSource = path.relative(PROJECT_ROOT, sourcePath);

    const metadata = {
      archiveId: `${now.toISOString().replace(/[-:.TZ]/g, '')}-${Math.floor(Math.random() * 1e6)}`,
      timestamp: now.toISOString(),
      archivedBy: process.env.USER || process.env.USERNAME || 'unknown',
      source: {
        path: relativeSource,
        gitCommit: gitInfo.commit,
        gitBranch: gitInfo.branch,
        gitTags: gitInfo.tags,
      },
      metadata: {
        name: path.basename(relativeSource),
        type: type || 'code',
        reason: reason || 'archived',
        category: category || 'general',
      },
    };

    if (await pathExists(sourcePath)) {
      const fileSummary = await this.summariseFiles(sourcePath);
      metadata.files = fileSummary.files;
      metadata.dependencies = fileSummary.dependencies;
    }

    return metadata;
  }

  async summariseFiles(sourcePath) {
    const result = { files: { count: 0, totalSize: '0B', types: [] }, dependencies: {} };

    let totalSize = 0;
    const extensions = new Set();

    const traverse = async (target) => {
      const stat = await fsp.stat(target);
      if (stat.isDirectory()) {
        const entries = await fsp.readdir(target);
        await Promise.all(entries.map((entry) => traverse(path.join(target, entry))));
      } else if (stat.isFile()) {
        result.files.count += 1;
        totalSize += stat.size;
        const ext = path.extname(target);
        if (ext) {
          extensions.add(ext);
        }
      }
    };

    await traverse(sourcePath);

    result.files.totalSize = this.formatBytes(totalSize);
    result.files.types = Array.from(extensions).sort();

    return result;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)}${sizes[i]}`;
  }

  async createReadme({ archiveDestination, metadata, timestamp, gitInfo, name }) {
    const templatePath = path.resolve(this.archiveRoot, 'templates/README-template.md');
    const readmePath = path.join(archiveDestination, 'README.md');

    if (await pathExists(templatePath)) {
      const template = await fsp.readFile(templatePath, 'utf8');
      const initialised = template
        .replace('[Feature/Component Name]', metadata.metadata.name || name)
        .replace('YYYY-MM-DD', timestamp)
        .replace('[Your Name/Team]', metadata.archivedBy || 'Unknown')
        .replace('path/to/original/files', metadata.source.path)
        .replace('abc123def', gitInfo.commit.slice(0, 7));

      await fsp.writeFile(readmePath, initialised);
    }
  }

  async appendLog(entry) {
    const existing = (await pathExists(ARCHIVE_LOG_PATH))
      ? await readJson(ARCHIVE_LOG_PATH)
      : [];

    existing.push(entry);
    await writeJson(ARCHIVE_LOG_PATH, existing);
  }

  // Search helper used to locate existing archives via CLI.
  async search(term) {
    await this.loadConfig();

    if (!(await pathExists(ARCHIVE_LOG_PATH))) {
      return [];
    }

    const entries = await readJson(ARCHIVE_LOG_PATH);
    const normalised = term.trim().toLowerCase();

    return entries.filter((entry) => [
      entry.metadata.name,
      entry.metadata.reason,
      entry.source.path,
    ].some((value) => value && value.toLowerCase().includes(normalised)));
  }
}

async function main() {
  const manager = new ArchiveManager();
  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'search') {
      const query = args.join(' ');
      if (!query) {
        console.log('Provide a search term, e.g. `archive.js search legacy`.');
        return;
      }

      const results = await manager.search(query);
      if (!results.length) {
        console.log('No archives found.');
        return;
      }

      results.forEach((entry) => {
        const date = entry.timestamp.split('T')[0];
        console.log(`\n📦 ${entry.metadata.name}`);
        console.log(`    Path: ${entry.source.path}`);
        console.log(`    Date: ${date}`);
        console.log(`    Reason: ${entry.metadata.reason}`);
      });
      console.log('\n');
      return;
    }

    const sourcePath = command;
    if (!sourcePath) {
      console.log(`Usage:\n  archive.js <source-path> [reason] [name] [category]\n  archive.js search <term>`);
      return;
    }

    const [reason, name, category] = args;
    const archivePath = await manager.archive(sourcePath, { reason, name, category });
    console.log(`\n✅ Archive created at ${path.relative(PROJECT_ROOT, archivePath)}`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = ArchiveManager;
