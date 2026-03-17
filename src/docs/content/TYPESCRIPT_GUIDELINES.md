# TypeScript Guidelines

## `any` Type Usage Policy

### Current Status

- Do not hardcode debt totals here. They rot too quickly and become fake comfort.
- Measure current debt before release with:

```bash
rg -o "\bany\b" src --glob '!src/admin-ui/node_modules/**' --glob '!src/admin-ui-dist/**' | wc -l
rg -n "@ts-ignore|eslint-disable" src --glob '!src/admin-ui/node_modules/**' --glob '!src/admin-ui-dist/**' | wc -l
```

- Treat rising counts as a release smell, especially in boundary code: route handlers, config loading, plugin execution, provider adapters, and admin API contracts.

### Acceptable Uses of `any`

The following patterns are acceptable uses of `any` and should be marked with an eslint-disable comment:

#### 1. Test Files

Test mocks and fixtures are exempt. No comments needed in `.test.ts` files.

#### 2. External Library Integrations

When integrating with libraries that lack TypeScript definitions:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- External library lacks types
private client: any;
```

#### 3. Dynamic JSON from Untyped APIs

When parsing responses from external APIs without schema:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic API response
const data: any = await response.json();
```

#### 4. Plugin Handlers with Flexible Parameters

Tool handlers that accept varied input structures:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Tool handler accepts varied input
handler: (params: any) => Promise<any>;
```

#### 5. Browser Automation (Puppeteer)

DOM elements in page.evaluate() callbacks - types don't apply in browser context:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
const data = await page.evaluate(() => {
  const headings = Array.from(document.querySelectorAll('h1')).map((h: any) => h.innerText);
  return headings;
});
/* eslint-enable @typescript-eslint/no-explicit-any */
```

#### 6. OpenTUI Components

VNodes and Renderables from OpenTUI lack TypeScript definitions:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
private layout: any;
```

#### 7. Admin UI Dynamic Configurations

Provider/integration configs that vary by type:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// Provider configurations vary by provider type
const config: any = agent.providers?.[providerId] || {};
```

### Unacceptable Uses (Must Fix)

1. **Function parameters** - Use proper interfaces or `unknown` with type guards
2. **Return types** - Define proper return types
3. **Class properties** - Define interfaces for data structures
4. **Catch blocks** - Use `catch (e: unknown)` with type guards

### Pattern: Unknown with Type Guards

Instead of:

```typescript
catch (e: any) {
  console.log(e.message);
}
```

Use:

```typescript
catch (e: unknown) {
  console.log(e instanceof Error ? e.message : String(e));
}
```

### Pattern: Branded Types for External Data

```typescript
import { z } from 'zod';

const ApiResponseSchema = z.object({
  id: z.string(),
  data: z.unknown(),
});

type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Validate at boundary
const response = ApiResponseSchema.parse(await fetchJson(url));
```

## Completed Type Safety Improvements

1. **Catch blocks:** Fixed 24 `catch (e: any)` → `catch (e: unknown)` with type guards
2. **Platform configs:** Added typed interfaces (TelegramPlatformConfig, etc.)
3. **Plugin onInit:** Updated 13 plugins to use `AgentConfig` type
4. **Tool handlers:** Fixed params types in filesystem-plugin, adventure-plugin
5. **Puppeteer types:** Added Browser and Page types from puppeteer package
6. **Template updates:** Updated plugin template with best practices
