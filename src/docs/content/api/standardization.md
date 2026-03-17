# API Response Standardization Guide

## Overview

All Admin API routes must use standardized response wrappers to ensure consistency across the system. This provides predictable error handling, automatic type safety, and seamless frontend integration.

## Standard Response Format

```typescript
interface StandardApiResponse<T = unknown> {
  success: boolean; // Indicates if request succeeded
  data?: T; // Response data (present on success)
  error?: string; // Error message (present on failure)
  errors?: string[]; // Detailed errors (optional, for validation)
  metadata?: {
    // Response metadata
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: PaginationMetadata;
  };
}
```

## Helper Functions

Located in `src/admin-api/types/responses.ts`:

### `apiSuccess<T>(data: T, metadata?: Partial<ResponseMetadata>)`

Wraps successful responses with standard format.

**Usage:**

```typescript
// Simple success
return {
  response: Response.json(apiSuccess({ userId: '123' })),
  handled: true,
};

// With custom headers
return {
  response: Response.json(apiSuccess(data), { headers }),
  handled: true,
};

// With status code
return {
  response: Response.json(apiSuccess(data), { status: 201, headers }),
  handled: true,
};
```

### `apiError(error: string, errors?: string[], metadata?: Partial<ResponseMetadata>)`

Wraps error responses with standard format.

**Usage:**

```typescript
// Simple error
return {
  response: Response.json(apiError('User not found'), { status: 404, headers }),
  handled: true,
};

// With validation errors
return {
  response: Response.json(
    apiError('Validation failed', ['Email is required', 'Password too short']),
    { status: 400, headers }
  ),
  handled: true,
};
```

### `apiPaginated<T>(data: T, pagination: PaginationMetadata, metadata?: Partial<ResponseMetadata>)`

Wraps paginated responses.

**Usage:**

```typescript
return {
  response: Response.json(
    apiPaginated(items, {
      page: 1,
      pageSize: 20,
      total: 100,
      hasMore: true,
      totalPages: 5,
    }),
    { headers }
  ),
  handled: true,
};
```

## Migration Patterns

### ❌ Before (Non-Standard)

```typescript
// Error response - OLD
return {
  response: Response.json({ error: 'Not found' }, { status: 404, headers }),
  handled: true,
};

// Success response - OLD
return {
  response: Response.json({ success: true, data: result }, { headers }),
  handled: true,
};

// Raw data - OLD
return {
  response: Response.json(data, { headers }),
  handled: true,
};
```

### ✅ After (Standardized)

```typescript
// Error response - NEW
return {
  response: Response.json(apiError('Not found'), { status: 404, headers }),
  handled: true,
};

// Success response - NEW
return {
  response: Response.json(apiSuccess(result), { headers }),
  handled: true,
};

// Raw data - NEW
return {
  response: Response.json(apiSuccess(data), { headers }),
  handled: true,
};
```

## Step-by-Step Migration Guide

### 1. Add Import

Add to the top of your route file:

```typescript
import { apiSuccess, apiError } from '@/admin-api/types/responses';
```

### 2. Identify Response Patterns

**Error Responses:**

- `{ error: "..." }` → `apiError("...")`
- `{ success: false, error: "..." }` → `apiError("...")`
- `new Response(JSON.stringify({ error: "..." }))` → `Response.json(apiError("..."))`

**Success Responses:**

- `{ success: true, data: X }` → `apiSuccess(X)`
- `someData` → `apiSuccess(someData)`
- `{}` → `apiSuccess({})`
- `[]` → `apiSuccess([])`

### 3. Replace Response Calls

**Pattern 1: Error with status**

```typescript
// Before
Response.json({ error: 'Invalid input' }, { status: 400, headers });

// After
Response.json(apiError('Invalid input'), { status: 400, headers });
```

**Pattern 2: Success with data**

```typescript
// Before
Response.json({ success: true, data: user }, { headers });

// After
Response.json(apiSuccess(user), { headers });
```

**Pattern 3: Conditional responses**

```typescript
// Before
Response.json(
  {
    success: result.success,
    message: result.message,
    error: result.error,
  },
  { headers }
);

// After
if (result.success) {
  return {
    response: Response.json(apiSuccess({ message: result.message }), { headers }),
    handled: true,
  };
} else {
  return {
    response: Response.json(apiError(result.error || 'Operation failed'), { headers }),
    handled: true,
  };
}
```

## Frontend Auto-Unwrapping

The `fetchJson` utility automatically unwraps standard responses:

```typescript
// Backend returns: { success: true, data: { userId: "123" } }
const user = await fetchJson<{ userId: string }>('/admin/api/user');
// user = { userId: "123" } (automatically unwrapped!)

// Backend returns: { success: false, error: "Not found" }
try {
  const user = await fetchJson('/admin/api/user');
} catch (err) {
  console.error(err.message); // "Not found"
}
```

## Common Patterns

### Error Handling

```typescript
try {
  const result = await someOperation();
  return {
    response: Response.json(apiSuccess(result), { headers }),
    handled: true,
  };
} catch (error) {
  logger.error('Operation failed:', error);
  return {
    response: Response.json(apiError(error instanceof Error ? error.message : 'Operation failed'), {
      status: 500,
      headers,
    }),
    handled: true,
  };
}
```

### Validation Errors

```typescript
const errors: string[] = [];
if (!data.email) errors.push('Email is required');
if (!data.password) errors.push('Password is required');

if (errors.length > 0) {
  return {
    response: Response.json(apiError('Validation failed', errors), { status: 400, headers }),
    handled: true,
  };
}
```

### Empty Responses

```typescript
// DELETE operation with no data
return {
  response: Response.json(apiSuccess({}), { headers }),
  handled: true,
};

// List endpoint with no results
return {
  response: Response.json(apiSuccess([]), { headers }),
  handled: true,
};
```

## Migration Status

### ✅ Fully Migrated

- `agent-routes.ts`
- `config-routes.ts`
- `erc8004-routes.ts`
- `provider-routes.ts`

### 🔄 Partially Migrated

- `testing-routes.ts` - 4 of 22 calls migrated
- `memory-routes.ts` - some calls migrated
- `knowledge-routes.ts` - import added, calls need wrapping
- Others - see below

### 📋 Remaining Files

Files with non-wrapped Response.json calls:

- `testing-routes.ts`: ~18 remaining
- `memory-routes.ts`: ~19 remaining
- `knowledge-routes.ts`: ~6 remaining
- `media-routes.ts`: ~6 remaining
- `threads-routes.ts`: ~7 remaining
- `logs-routes.ts`: ~2 remaining
- `adventures-routes.ts`: ~2 remaining
- And others...

## Benefits

### Type Safety

- Frontend automatically gets correct types
- No need to manually unwrap `{ success, data }` objects
- TypeScript catches mismatches

### Consistency

- All endpoints return predictable format
- Same error handling everywhere
- Easy to add global interceptors

### Developer Experience

- Less boilerplate in frontend code
- Automatic error extraction
- Clear migration path for new routes

### Future-Proofing

- Easy to add metadata (request IDs, timing, etc.)
- Standardized pagination
- Consistent versioning strategy

## Testing

After migration, verify:

1. ✅ No TypeScript errors
2. ✅ Frontend receives unwrapped data
3. ✅ Errors are properly caught and displayed
4. ✅ Status codes are preserved
5. ✅ Headers are maintained

## Questions?

See:

- `src/admin-api/types/responses.ts` - Type definitions and helpers
- `src/admin-ui/utils/api/http-client.ts` - Frontend transport and response unwrapping
- `src/admin-api/routes/agent-routes.ts` - Example of fully migrated file
