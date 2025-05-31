# TypeScript Cleanup Plan

## Overview
This document outlines the systematic cleanup of TypeScript issues to improve type safety and code maintainability.

## Current Issues Summary

### Critical Type Issues Found
- **Total `any` usages**: 150+ instances
- **Type assertions (`as any`)**: 45+ instances
- **Missing type definitions**: 30+ functions/variables
- **Inconsistent interface usage**: Multiple components

## Phase 1: Replace Critical `any` Types

### 1.1 Database and API Response Types

#### Current Issues
```typescript
// BEFORE (Type Unsafe)
const shows: any[] = [];
const artistData = show.artists as any;
const venueData = show.venues as any;
```

#### Solution
```typescript
// AFTER (Type Safe)
import { Show, Artist, Venue } from '@/types/database';

const shows: Show[] = [];
const artistData = show.artists as Artist;
const venueData = show.venues as Venue;
```

### 1.2 Component Props and State

#### Files to Fix Immediately
```typescript
// src/pages/ArtistPage/useArtistData.ts
// BEFORE
const [upcomingShows, setUpcomingShows] = useState<any[]>([]);
const [pastShows, setPastShows] = useState<any[]>([]);

// AFTER
const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
const [pastShows, setPastShows] = useState<Show[]>([]);
```

### 1.3 Service Layer Types

#### Search Service
```typescript
// src/services/search.ts
// BEFORE
const shows = (artist.shows as any[]) || [];
const venue = nextShow?.venues as any;

// AFTER
const shows = (artist.shows as Show[]) || [];
const venue = nextShow?.venues as Venue;
```

## Phase 2: Enhanced Type Definitions

### 2.1 Create Missing Interface Definitions

#### Component Props Interfaces
```typescript
// src/types/components.ts
export interface ArtistCatalogProps {
  artistId: string;
  onSongSelect?: (song: Song) => void;
}

export interface SearchResultsProps {
  query: string;
  filters?: SearchFilters;
}

export interface VotingStatsProps {
  showId: string;
  setlistId?: string;
}
```

#### Hook Return Types
```typescript
// src/types/hooks.ts
export interface UseArtistDataReturn {
  artist: SpotifyArtist | null;
  upcomingShows: Show[];
  pastShows: Show[];
  loading: boolean;
  setlistId: string | null;
}

export interface UseVotingReturn {
  userVotes: Set<string>;
  voteLimits: VoteLimits;
  isLoading: boolean;
  submitVote: (songId: string) => Promise<void>;
  removeVote: (songId: string) => Promise<void>;
}
```

### 2.2 Service Response Types

#### API Response Wrappers
```typescript
// src/types/api.ts
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: string[];
}
```

## Phase 3: Generic Type Improvements

### 3.1 Generic Utility Functions

#### Database Manager
```typescript
// src/services/databaseManager.ts
// BEFORE
export async function executeQuery(query: string, params?: any[]): Promise<any> {

// AFTER
export async function executeQuery<T = any>(
  query: string, 
  params?: unknown[]
): Promise<ServiceResponse<T>> {
  try {
    const { data, error } = await supabase.rpc(query, params);
    return {
      data: data as T,
      error: error?.message || null,
      success: !error
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      success: false
    };
  }
}
```

### 3.2 Event Handler Types

#### Realtime Subscriptions
```typescript
// src/services/realtime.ts
// BEFORE
subscribeToSetlistVotes(setlistId: string, onUpdate: (payload: any) => void)

// AFTER
interface VoteUpdatePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Vote;
  old: Vote | null;
}

subscribeToSetlistVotes(
  setlistId: string, 
  onUpdate: (payload: VoteUpdatePayload) => void
)
```

## Phase 4: Error Handling Types

### 4.1 Structured Error Types

```typescript
// src/types/errors.ts
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
}

export class TypedError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TypedError';
  }
}
```

### 4.2 Error Handler Updates

```typescript
// src/services/errorHandling.ts
// BEFORE
export function handleError(error: any, context?: string): void

// AFTER
export function handleError(
  error: Error | TypedError | unknown, 
  context?: string
): AppError {
  if (error instanceof TypedError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date()
    };
  }
  
  if (error instanceof Error) {
    return {
      code: ErrorCode.API_ERROR,
      message: error.message,
      timestamp: new Date()
    };
  }
  
  return {
    code: ErrorCode.API_ERROR,
    message: 'Unknown error occurred',
    details: { originalError: error },
    timestamp: new Date()
  };
}
```

## Implementation Strategy

### Week 1: Critical Fixes

#### Day 1-2: Database Types
```bash
# Priority files
src/services/search.ts
src/services/catalog.ts
src/pages/ArtistPage/useArtistData.ts
src/components/TrendingShows.tsx
```

#### Day 3-4: Component Props
```bash
# Component interfaces
src/components/ArtistCatalog.tsx
src/components/VotingStats.tsx
src/pages/SearchResults.tsx
src/components/SearchWithFilters.tsx
```

#### Day 5: Service Layer
```bash
# Service type safety
src/services/realtime.ts
src/services/auth.ts
src/hooks/useRealtimeVoting.ts
```

### Week 2: Advanced Types

#### Generic Functions
```typescript
// Template for generic service functions
export async function fetchData<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<ServiceResponse<T>> {
  // Implementation
}

// Usage
const artistsResponse = await fetchData<Artist[]>('/artists');
const showsResponse = await fetchData<Show[]>('/shows', { artistId });
```

#### Hook Type Safety
```typescript
// Template for typed hooks
export function useTypedState<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  return useState<T>(initialValue);
}

// Usage
const [shows, setShows] = useTypedState<Show[]>([]);
const [loading, setLoading] = useTypedState<boolean>(false);
```

## Automated Tools and Scripts

### 1. Type Checking Script
```bash
#!/bin/bash
# scripts/type-check.sh

echo "Running TypeScript strict checks..."
npx tsc --noEmit --strict

echo "Checking for any types..."
grep -r "\: any\b" src/ --include="*.ts" --include="*.tsx" || echo "No 'any' types found!"

echo "Checking for type assertions..."
grep -r "as any\b" src/ --include="*.ts" --include="*.tsx" || echo "No 'as any' assertions found!"
```

### 2. ESLint Rules
```json
// .eslintrc.json additions
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

### 3. Pre-commit Hook
```bash
#!/bin/sh
# .husky/pre-commit

npm run type-check
if [ $? -ne 0 ]; then
  echo "TypeScript errors found. Please fix before committing."
  exit 1
fi
```

## File-by-File Cleanup Plan

### High Priority Files (Week 1)
1. `src/services/search.ts` - 8 `any` usages
2. `src/pages/ArtistPage/useArtistData.ts` - 6 `any` usages
3. `src/components/TrendingShows.tsx` - 4 `any` usages
4. `src/services/catalog.ts` - 5 `any` usages
5. `src/hooks/useRealtimeVoting.ts` - 3 `any` usages

### Medium Priority Files (Week 2)
1. `src/services/realtime.ts` - 7 `any` usages
2. `src/components/VotingStats.tsx` - 4 `any` usages
3. `src/services/userAnalytics.ts` - 6 `any` usages
4. `src/components/SearchWithFilters.tsx` - 2 `any` usages
5. `src/services/backgroundJobs.ts` - 4 `any` usages

### Low Priority Files (Week 3)
1. Test files with mock data
2. Development utilities
3. Legacy components

## Success Metrics

### Before Cleanup
- `any` type usages: 150+
- Type safety score: ~60%
- TypeScript strict mode: Disabled
- Runtime type errors: Frequent

### After Cleanup (Target)
- `any` type usages: <10 (only where absolutely necessary)
- Type safety score: >95%
- TypeScript strict mode: Enabled
- Runtime type errors: Rare

## Testing Strategy

### 1. Type-Only Tests
```typescript
// src/types/__tests__/database.test.ts
import { Artist, Show, Venue } from '../database';

// Test type compatibility
const testArtist: Artist = {
  id: 'test',
  name: 'Test Artist',
  spotify_id: 'spotify_test',
  // ... other required fields
};

// This should cause a TypeScript error if types are wrong
const invalidArtist: Artist = {
  id: 123, // Should be string
  name: 'Test'
};
```

### 2. Runtime Type Validation
```typescript
// src/utils/typeGuards.ts
export function isArtist(obj: unknown): obj is Artist {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Artist).id === 'string' &&
    typeof (obj as Artist).name === 'string'
  );
}

export function isShow(obj: unknown): obj is Show {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Show).id === 'string' &&
    typeof (obj as Show).date === 'string'
  );
}
```

## Migration Checklist

### Phase 1 Checklist
- [ ] Update `src/types/database.ts` with comprehensive types
- [ ] Fix all database query return types
- [ ] Update component prop interfaces
- [ ] Fix useState type parameters
- [ ] Update service function signatures

### Phase 2 Checklist
- [ ] Add generic type parameters to utility functions
- [ ] Create error type hierarchy
- [ ] Update event handler types
- [ ] Add type guards for runtime validation
- [ ] Enable strict TypeScript mode

### Phase 3 Checklist
- [ ] Add ESLint rules for type safety
- [ ] Create automated type checking scripts
- [ ] Add pre-commit hooks
- [ ] Update documentation with type examples
- [ ] Train team on new type patterns

## Risk Mitigation

### Gradual Migration
- Implement changes file by file
- Maintain backward compatibility during transition
- Use feature flags for new type-safe implementations
- Keep comprehensive test coverage

### Rollback Strategy
- Git branch for each phase
- Automated testing before merging
- Monitoring for runtime errors
- Quick rollback procedures documented

## Long-term Maintenance

### Code Review Guidelines
- No new `any` types without justification
- All new functions must have proper type signatures
- Props interfaces required for all components
- Type guards for external data

### Continuous Improvement
- Monthly type safety audits
- Update types when APIs change
- Refactor legacy code incrementally
- Share type patterns across team