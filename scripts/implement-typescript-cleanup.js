#!/usr/bin/env node

/**
 * TypeScript Cleanup Implementation Script
 * This script systematically fixes TypeScript issues across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// TypeScript cleanup utilities
const typeScriptCleanup = {
  // Fix any types in a file
  fixAnyTypes: (filePath) => {
    if (!fs.existsSync(filePath)) {
      log(`⚠️  File not found: ${filePath}`, 'yellow');
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Common any type patterns and their replacements
    const anyTypeReplacements = [
      // Database types
      { pattern: /: any\[\]/g, replacement: ': Show[]', imports: ['Show'] },
      { pattern: /as any\[\]/g, replacement: 'as Show[]', imports: ['Show'] },
      { pattern: /: any(?=\s*[;,})])/g, replacement: ': unknown', imports: [] },
      { pattern: /as any(?=\s*[;,})])/g, replacement: 'as unknown', imports: [] },
      
      // Event handlers
      { pattern: /\(.*?\) => any/g, replacement: '(event: Event) => void', imports: [] },
      { pattern: /: any => void/g, replacement: ': (event: Event) => void', imports: [] },
      
      // API responses
      { pattern: /Promise<any>/g, replacement: 'Promise<unknown>', imports: [] },
      { pattern: /: any = await/g, replacement: ': unknown = await', imports: [] }
    ];
    
    // Apply replacements
    anyTypeReplacements.forEach(({ pattern, replacement, imports }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
        
        // Add necessary imports
        imports.forEach(importName => {
          if (!content.includes(`import.*${importName}`) && !content.includes(`type ${importName}`)) {
            // Add import from database types
            if (!content.includes("import.*from '@/types/database'")) {
              const importLine = `import { ${importName} } from '@/types/database';\n`;
              content = importLine + content;
            } else {
              // Add to existing import
              content = content.replace(
                /(import\s*{[^}]*)(}\s*from\s*['"]@\/types\/database['"])/,
                `$1, ${importName}$2`
              );
            }
          }
        });
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      log(`✅ Fixed any types in ${path.basename(filePath)}`, 'green');
      return true;
    }
    
    return false;
  },
  
  // Add proper interface definitions
  addInterfaceDefinitions: (filePath) => {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Common interface patterns to add
    const interfaceDefinitions = `
// Enhanced type definitions
interface VotingData {
  setlist_song_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at?: string;
}

interface SearchFilters {
  artist?: string;
  venue?: string;
  city?: string;
  state?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}
`;
    
    // Add interfaces if they don't exist
    if (!content.includes('interface VotingData') && 
        (content.includes('vote') || content.includes('voting'))) {
      content = interfaceDefinitions + content;
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      log(`✅ Added interface definitions to ${path.basename(filePath)}`, 'green');
      return true;
    }
    
    return false;
  },
  
  // Fix function return types
  fixFunctionReturnTypes: (filePath) => {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Common function patterns that need return types
    const functionPatterns = [
      {
        pattern: /async function\s+(\w+)\s*\([^)]*\)\s*{/g,
        replacement: (match, funcName) => {
          if (match.includes(': Promise<')) return match;
          return match.replace('{', ': Promise<unknown> {');
        }
      },
      {
        pattern: /const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>/g,
        replacement: (match) => {
          if (match.includes(': Promise<')) return match;
          return match.replace('=>', ': Promise<unknown> =>');
        }
      }
    ];
    
    functionPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      log(`✅ Fixed function return types in ${path.basename(filePath)}`, 'green');
      return true;
    }
    
    return false;
  },
  
  // Add strict type checking
  enableStrictMode: () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      log('⚠️  tsconfig.json not found', 'yellow');
      return false;
    }
    
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Enable strict mode options
    const strictOptions = {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      noUnusedParameters: true
    };
    
    let hasChanges = false;
    Object.entries(strictOptions).forEach(([key, value]) => {
      if (tsconfig.compilerOptions[key] !== value) {
        tsconfig.compilerOptions[key] = value;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      log('✅ Enabled TypeScript strict mode', 'green');
      return true;
    }
    
    return false;
  },
  
  // Update ESLint configuration for TypeScript
  updateESLintConfig: () => {
    const eslintConfigPath = path.join(process.cwd(), '.eslintrc.json');
    
    if (!fs.existsSync(eslintConfigPath)) {
      // Create new ESLint config
      const eslintConfig = {
        extends: [
          '@typescript-eslint/recommended',
          '@typescript-eslint/recommended-requiring-type-checking'
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          project: './tsconfig.json'
        },
        plugins: ['@typescript-eslint'],
        rules: {
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/explicit-function-return-type': 'warn',
          '@typescript-eslint/no-non-null-assertion': 'warn',
          '@typescript-eslint/prefer-nullish-coalescing': 'error',
          '@typescript-eslint/prefer-optional-chain': 'error'
        }
      };
      
      fs.writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2));
      log('✅ Created ESLint TypeScript configuration', 'green');
      return true;
    }
    
    return false;
  }
};

// File processing utilities
const fileProcessor = {
  // Get all TypeScript files that need cleanup
  getFilesToProcess: () => {
    const srcDir = path.join(process.cwd(), 'src');
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      });
    }
    
    if (fs.existsSync(srcDir)) {
      walkDir(srcDir);
    }
    
    return files;
  },
  
  // Count any types in a file
  countAnyTypes: (filePath) => {
    if (!fs.existsSync(filePath)) return 0;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const anyMatches = content.match(/\bany\b/g) || [];
    
    // Filter out comments and strings
    const lines = content.split('\n');
    let actualAnyCount = 0;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*')) {
        const anyInLine = (line.match(/\bany\b/g) || []).length;
        actualAnyCount += anyInLine;
      }
    });
    
    return actualAnyCount;
  },
  
  // Process a single file
  processFile: (filePath) => {
    const beforeCount = fileProcessor.countAnyTypes(filePath);
    let hasChanges = false;
    
    // Apply all cleanup functions
    hasChanges |= typeScriptCleanup.fixAnyTypes(filePath);
    hasChanges |= typeScriptCleanup.addInterfaceDefinitions(filePath);
    hasChanges |= typeScriptCleanup.fixFunctionReturnTypes(filePath);
    
    const afterCount = fileProcessor.countAnyTypes(filePath);
    
    if (hasChanges) {
      const improvement = beforeCount - afterCount;
      log(`📊 ${path.basename(filePath)}: ${beforeCount} → ${afterCount} any types (${improvement > 0 ? '-' + improvement : 'no change'})`, 'blue');
    }
    
    return hasChanges;
  }
};

// Main implementation function
function implementTypeScriptCleanup() {
  log('🔧 Starting TypeScript cleanup implementation...', 'blue');
  
  try {
    // 1. Enable strict mode
    log('\n📋 Enabling TypeScript strict mode...', 'yellow');
    typeScriptCleanup.enableStrictMode();
    
    // 2. Update ESLint configuration
    log('\n🔍 Updating ESLint configuration...', 'yellow');
    typeScriptCleanup.updateESLintConfig();
    
    // 3. Get all files to process
    log('\n📁 Scanning for TypeScript files...', 'yellow');
    const filesToProcess = fileProcessor.getFilesToProcess();
    log(`Found ${filesToProcess.length} TypeScript files`, 'blue');
    
    // 4. Process files in priority order
    log('\n🔄 Processing files...', 'yellow');
    
    // Priority files (most critical)
    const priorityFiles = [
      'src/services/search.ts',
      'src/hooks/useArtistData.ts',
      'src/services/auth.ts',
      'src/services/api.ts',
      'src/services/realtime.ts',
      'src/hooks/useRealtimeConnection.ts',
      'src/hooks/useVoteLimits.ts'
    ];
    
    let processedCount = 0;
    let changedCount = 0;
    
    // Process priority files first
    priorityFiles.forEach(relativePath => {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        const hasChanges = fileProcessor.processFile(fullPath);
        processedCount++;
        if (hasChanges) changedCount++;
      }
    });
    
    // Process remaining files
    const remainingFiles = filesToProcess.filter(file => {
      const relativePath = path.relative(process.cwd(), file);
      return !priorityFiles.includes(relativePath);
    });
    
    remainingFiles.forEach(filePath => {
      const hasChanges = fileProcessor.processFile(filePath);
      processedCount++;
      if (hasChanges) changedCount++;
    });
    
    // 5. Generate type definitions for common patterns
    log('\n📝 Creating enhanced type definitions...', 'yellow');
    createEnhancedTypeDefinitions();
    
    // 6. Run type checking
    log('\n✅ Running TypeScript type checking...', 'yellow');
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      log('✅ TypeScript compilation successful', 'green');
    } catch (error) {
      log('⚠️  TypeScript compilation has errors (this is expected during cleanup)', 'yellow');
      log('Run `npm run type:check` to see detailed errors', 'blue');
    }
    
    // 7. Summary
    log('\n✅ TypeScript cleanup implementation completed!', 'green');
    log(`📊 Processed ${processedCount} files, modified ${changedCount} files`, 'blue');
    
    log('\n📋 Next steps:', 'blue');
    log('1. Run: npm run type:check to verify type safety');
    log('2. Run: npm run lint to check for remaining issues');
    log('3. Test the application to ensure functionality');
    log('4. Gradually fix remaining type errors');
    
  } catch (error) {
    log(`❌ Error during TypeScript cleanup: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Create enhanced type definitions
function createEnhancedTypeDefinitions() {
  const enhancedTypesContent = `
// Enhanced type definitions for the application
import { Database } from '@/integrations/supabase/types';

// Re-export database types for convenience
export type Show = Database['public']['Tables']['shows']['Row'];
export type Artist = Database['public']['Tables']['artists']['Row'];
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type SetlistSong = Database['public']['Tables']['setlist_songs']['Row'];

// Enhanced application types
export interface ShowWithRelations extends Show {
  artists?: Artist;
  venues?: Venue;
  setlist_songs?: SetlistSong[];
}

export interface ArtistWithShows extends Artist {
  shows?: ShowWithRelations[];
}

export interface SearchResult {
  artists: Artist[];
  shows: ShowWithRelations[];
  totalCount: number;
}

export interface VotingStats {
  totalVotes: number;
  upVotes: number;
  downVotes: number;
  userVote?: 'up' | 'down' | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

// Hook return types
export interface UseArtistDataReturn {
  artist: Artist | null;
  shows: ShowWithRelations[];
  upcomingShows: ShowWithRelations[];
  pastShows: ShowWithRelations[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export interface UseVotingReturn {
  votes: Record<string, VotingStats>;
  submitVote: (setlistSongId: string, voteType: 'up' | 'down') => Promise<void>;
  loading: boolean;
  error: ApiError | null;
}

// Component prop types
export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export interface VotingStatsProps {
  setlistSongId: string;
  initialStats?: VotingStats;
  disabled?: boolean;
}

export interface TrendingShowsProps {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormHandler<T> = {
  handleChange: (field: keyof T) => EventHandler<React.ChangeEvent<HTMLInputElement>>;
  handleBlur: (field: keyof T) => EventHandler<React.FocusEvent<HTMLInputElement>>;
  handleSubmit: AsyncEventHandler<React.FormEvent>;
  reset: () => void;
};
`;
  
  const filePath = path.join(process.cwd(), 'src/types/enhanced.ts');
  fs.writeFileSync(filePath, enhancedTypesContent);
  log('✅ Created enhanced type definitions', 'green');
}

// Run the implementation
if (require.main === module) {
  implementTypeScriptCleanup();
}

module.exports = {
  typeScriptCleanup,
  fileProcessor,
  implementTypeScriptCleanup
};