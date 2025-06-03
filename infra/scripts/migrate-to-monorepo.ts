#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

console.log('🚀 Starting migration to monorepo structure...\n');

// Step 1: Backup current structure
function backupCurrentStructure() {
  console.log('📦 Creating backup of current structure...');
  const backupDir = join(rootDir, 'backup-before-migration');
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir);
  }
  
  // Backup important directories
  const dirsToBackup = ['src', 'public', 'api', 'supabase'];
  
  dirsToBackup.forEach(dir => {
    const sourcePath = join(rootDir, dir);
    if (existsSync(sourcePath)) {
      cpSync(sourcePath, join(backupDir, dir), { recursive: true });
      console.log(`  ✅ Backed up ${dir}/`);
    }
  });
  
  console.log('  ✅ Backup complete\n');
}

// Step 2: Create monorepo structure
function createMonorepoStructure() {
  console.log('🏗️  Creating monorepo structure...');
  
  const dirs = [
    'apps/web',
    'apps/api',
    'packages/database',
    'packages/ui',
    'packages/config',
    'packages/types',
    'infra/docker',
    'infra/scripts',
    'docs'
  ];
  
  dirs.forEach(dir => {
    const dirPath = join(rootDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ Created ${dir}/`);
    }
  });
  
  console.log('\n');
}

// Step 3: Move existing code to appropriate locations
function moveExistingCode() {
  console.log('📂 Moving existing code to new structure...');
  
  // Move React app to apps/web-legacy (for reference during migration)
  const webLegacyDir = join(rootDir, 'apps/web-legacy');
  if (!existsSync(webLegacyDir)) {
    mkdirSync(webLegacyDir, { recursive: true });
  }
  
  // Move source files
  if (existsSync(join(rootDir, 'src'))) {
    cpSync(join(rootDir, 'src'), join(webLegacyDir, 'src'), { recursive: true });
    console.log('  ✅ Moved src/ to apps/web-legacy/src/');
  }
  
  // Move public files
  if (existsSync(join(rootDir, 'public'))) {
    cpSync(join(rootDir, 'public'), join(webLegacyDir, 'public'), { recursive: true });
    console.log('  ✅ Moved public/ to apps/web-legacy/public/');
  }
  
  // Move API files if they exist
  if (existsSync(join(rootDir, 'api'))) {
    cpSync(join(rootDir, 'api'), join(rootDir, 'apps/api/src'), { recursive: true });
    console.log('  ✅ Moved api/ to apps/api/src/');
  }
  
  console.log('\n');
}

// Step 4: Create package.json files
function createPackageJsonFiles() {
  console.log('📄 Creating package.json files...');
  
  // Root package.json
  const rootPackageJson = {
    name: "setlist-score-show",
    private: true,
    workspaces: [
      "apps/*",
      "packages/*"
    ],
    scripts: {
      dev: "turbo dev",
      build: "turbo build",
      test: "turbo test",
      lint: "turbo lint",
      "type-check": "turbo type-check",
      "db:migrate": "pnpm --filter @setlist/database migrate",
      "db:push": "pnpm --filter @setlist/database push",
      "db:seed": "pnpm --filter @setlist/database seed"
    },
    devDependencies: {
      turbo: "^2.0.0",
      "@types/node": "^20.0.0",
      typescript: "^5.4.0"
    },
    packageManager: "pnpm@9.0.0",
    engines: {
      node: ">=20.0.0"
    }
  };
  
  writeFileSync(
    join(rootDir, 'package.json'),
    JSON.stringify(rootPackageJson, null, 2)
  );
  console.log('  ✅ Created root package.json');
  
  // apps/web/package.json
  const webPackageJson = {
    name: "@setlist/web",
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      "type-check": "tsc --noEmit"
    },
    dependencies: {
      "@setlist/database": "workspace:*",
      "@setlist/ui": "workspace:*",
      "@setlist/types": "workspace:*",
      "@supabase/supabase-js": "^2.39.0",
      "@tanstack/react-query": "^5.0.0",
      "next": "14.1.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "autoprefixer": "^10.4.0",
      "postcss": "^8.4.0",
      "tailwindcss": "^3.4.0",
      "typescript": "^5.4.0"
    }
  };
  
  writeFileSync(
    join(rootDir, 'apps/web/package.json'),
    JSON.stringify(webPackageJson, null, 2)
  );
  console.log('  ✅ Created apps/web/package.json');
  
  // apps/api/package.json
  const apiPackageJson = {
    name: "@setlist/api",
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc",
      start: "node dist/index.js",
      lint: "eslint src --ext .ts",
      "type-check": "tsc --noEmit",
      "sync:setlists": "tsx src/jobs/sync-setlists.ts",
      "sync:spotify": "tsx src/jobs/sync-spotify.ts",
      "calculate:trending": "tsx src/jobs/calculate-trending.ts"
    },
    dependencies: {
      "@setlist/database": "workspace:*",
      "@setlist/types": "workspace:*",
      "@supabase/supabase-js": "^2.39.0",
      "fastify": "^4.25.0",
      "mercurius": "^13.3.0",
      "ioredis": "^5.3.0",
      "p-limit": "^5.0.0"
    },
    devDependencies: {
      "@types/node": "^20.0.0",
      "tsx": "^4.7.0",
      "typescript": "^5.4.0"
    }
  };
  
  writeFileSync(
    join(rootDir, 'apps/api/package.json'),
    JSON.stringify(apiPackageJson, null, 2)
  );
  console.log('  ✅ Created apps/api/package.json');
  
  // packages/database/package.json
  const databasePackageJson = {
    name: "@setlist/database",
    version: "0.1.0",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    scripts: {
      build: "tsc",
      generate: "prisma generate",
      migrate: "prisma migrate dev",
      push: "prisma db push",
      seed: "tsx src/seed.ts",
      studio: "prisma studio"
    },
    dependencies: {
      "@prisma/client": "^5.8.0"
    },
    devDependencies: {
      "prisma": "^5.8.0",
      "tsx": "^4.7.0",
      "typescript": "^5.4.0"
    }
  };
  
  writeFileSync(
    join(rootDir, 'packages/database/package.json'),
    JSON.stringify(databasePackageJson, null, 2)
  );
  console.log('  ✅ Created packages/database/package.json');
  
  console.log('\n');
}

// Step 5: Create configuration files
function createConfigFiles() {
  console.log('⚙️  Creating configuration files...');
  
  // turbo.json
  const turboConfig = {
    "$schema": "https://turbo.build/schema.json",
    "globalDependencies": ["**/.env.*local"],
    "pipeline": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": [".next/**", "dist/**"],
        "env": ["NODE_ENV", "NEXT_PUBLIC_*", "DATABASE_URL"]
      },
      "dev": {
        "cache": false,
        "persistent": true
      },
      "lint": {},
      "type-check": {},
      "test": {
        "dependsOn": ["build"]
      }
    }
  };
  
  writeFileSync(
    join(rootDir, 'turbo.json'),
    JSON.stringify(turboConfig, null, 2)
  );
  console.log('  ✅ Created turbo.json');
  
  // pnpm-workspace.yaml
  const pnpmWorkspace = `packages:
  - 'apps/*'
  - 'packages/*'
`;
  
  writeFileSync(join(rootDir, 'pnpm-workspace.yaml'), pnpmWorkspace);
  console.log('  ✅ Created pnpm-workspace.yaml');
  
  // .gitignore updates
  const gitignoreAdditions = `
# Turbo
.turbo
*.log

# Build outputs
dist/
.next/
out/

# Dependencies
node_modules/

# Environment files
.env*.local
`;
  
  const existingGitignore = existsSync(join(rootDir, '.gitignore')) 
    ? readFileSync(join(rootDir, '.gitignore'), 'utf-8')
    : '';
    
  writeFileSync(
    join(rootDir, '.gitignore'),
    existingGitignore + '\n' + gitignoreAdditions
  );
  console.log('  ✅ Updated .gitignore');
  
  console.log('\n');
}

// Step 6: Create migration guide
function createMigrationGuide() {
  console.log('📚 Creating migration guide...');
  
  const migrationGuide = `# Migration Guide

## Overview
This guide helps you complete the migration from the single React app to the monorepo structure.

## Structure Changes
- **apps/web**: New Next.js 14 application
- **apps/web-legacy**: Your existing React app (for reference)
- **apps/api**: Fastify + GraphQL API server
- **packages/database**: Prisma schema and client
- **packages/ui**: Shared UI components
- **packages/types**: Shared TypeScript types

## Migration Steps

### 1. Database Migration
\`\`\`bash
cd packages/database
pnpm prisma init
# Copy your schema from supabase/migrations to prisma/schema.prisma
pnpm prisma generate
pnpm prisma migrate dev
\`\`\`

### 2. Move Components
- Copy components from apps/web-legacy/src/components to:
  - packages/ui/src for shared components
  - apps/web/components for app-specific components

### 3. Setup API
- Move service logic from apps/web-legacy/src/services to apps/api/src/services
- Create GraphQL resolvers for each service

### 4. Update Imports
- Change imports from relative paths to package imports:
  - \`import { Button } from '@setlist/ui'\`
  - \`import { PrismaClient } from '@setlist/database'\`

### 5. Environment Variables
- Create .env files in each app:
  - apps/web/.env.local
  - apps/api/.env

### 6. Test Everything
\`\`\`bash
pnpm dev # Starts all apps
\`\`\`

## Rollback
If you need to rollback:
1. Your original code is backed up in /backup-before-migration
2. The legacy app is preserved in apps/web-legacy
`;
  
  writeFileSync(join(rootDir, 'MIGRATION_GUIDE.md'), migrationGuide);
  console.log('  ✅ Created MIGRATION_GUIDE.md');
  
  console.log('\n');
}

// Main execution
async function main() {
  try {
    backupCurrentStructure();
    createMonorepoStructure();
    moveExistingCode();
    createPackageJsonFiles();
    createConfigFiles();
    createMigrationGuide();
    
    console.log('✨ Migration preparation complete!\n');
    console.log('Next steps:');
    console.log('1. Review the MIGRATION_GUIDE.md');
    console.log('2. Install pnpm if not already installed: npm install -g pnpm');
    console.log('3. Run: pnpm install');
    console.log('4. Start migrating your code following the guide');
    console.log('\nYour original code is backed up in /backup-before-migration');
    console.log('The legacy app is preserved in apps/web-legacy for reference\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();