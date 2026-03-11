# Style Guide

Coding standards for the Papers template.

## Table of Contents

- [TypeScript Guidelines](#typescript-guidelines)
- [React Guidelines](#react-guidelines)
- [CSS and Styling](#css-and-styling)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Component Patterns](#component-patterns)
- [Performance Best Practices](#performance-best-practices)

## TypeScript Guidelines

### General Rules

- Use TypeScript with strict mode
- Avoid `any` - use `unknown` or proper types
- Type inference for locals, explicit for public APIs

### Type Definitions

```typescript
// ✅ Good - Use interfaces for objects
interface UserProps {
  name: string;
  age: number;
  email?: string; // Optional properties
}

// ✅ Good - Use type for unions and primitives
type Status = 'idle' | 'loading' | 'success' | 'error';
type ID = string | number;

// ❌ Avoid - Don't use any
function processData(data: any) {} // Bad

// ✅ Good - Use generics for reusable code
function processData<T>(data: T): T {}
```

### Function Types

```typescript
// ✅ Good - Named function with explicit return type for public APIs
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good - Arrow functions for callbacks
const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
  event.preventDefault();
};

// ✅ Good - Type function parameters
type ClickHandler = (event: MouseEvent<HTMLButtonElement>) => void;
```

## React Guidelines

### Component Structure

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  children,
  disabled = false,
}) => (
  <button
    className={`btn btn-${variant}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);
```

### Hooks Usage

```typescript
// ✅ Good - Custom hooks start with 'use'
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  // ... rest of implementation
}

// ✅ Good - Proper dependencies in useEffect
useEffect(() => {
  const handler = () => console.log('resize');
  window.addEventListener('resize', handler);

  return () => window.removeEventListener('resize', handler);
}, []); // Empty deps for mount/unmount only
```

### Component Best Practices

- React.memo for expensive components
- useCallback for memoized children functions
- useMemo for expensive computations
- Avoid inline functions in render

```typescript
// ✅ Good - Memoized component
const ExpensiveList = React.memo(({ items, onItemClick }) => {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// ✅ Good - Parent component
function ParentComponent() {
  const [items, setItems] = useState<Item[]>([]);

  const handleItemClick = useCallback((item: Item) => {
    console.log('Clicked:', item);
  }, []);

  return <ExpensiveList items={items} onItemClick={handleItemClick} />;
}
```

## CSS and Styling

### Tailwind CSS

- Use Tailwind utilities primarily
- Custom utilities in globals.css for patterns
- CSS Modules for complex component styles

```tsx
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between p-4 bg-background-color rounded-lg">

// ✅ Good - Conditional classes
<button className={cn(
  "px-4 py-2 rounded transition-colors",
  variant === 'primary' && "bg-primary text-white",
  variant === 'secondary' && "bg-secondary text-black",
  disabled && "opacity-50 cursor-not-allowed"
)}>

// ✅ Good - Extract repeated patterns
// globals.css
.card {
  @apply p-4 rounded-lg border border-border-color bg-card-background;
}
```

### CSS Variables

```css
/* ✅ Good - Use CSS variables for theming */
:root {
  --primary-color: #ff85a1;
  --background-color: #ffffff;
  --text-color: #1a1a1a;
}

.dark {
  --primary-color: #ffc4dd;
  --background-color: #1e1e2e;
  --text-color: #ffffff;
}
```

## File Organization

### Directory Structure

```
app/
├── components/          # React components
├── utils/              # Utility functions
├── types/              # TypeScript types
├── lib/                # Core utilities
└── providers/          # React contexts
```

```

### Component Files

```

components/Button/
├── Button.tsx # Component implementation
├── Button.module.css # Component styles (if needed)
├── Button.test.tsx # Component tests
└── index.ts # Export file

````

## Naming Conventions

### Files and Folders

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `PascalCase.ts`
- Constants: `UPPER_SNAKE_CASE`

### Variables and Functions

```typescript
// ✅ Good - Descriptive names
const userProfile = { name: 'John', age: 30 };
const isAuthenticated = true;
const hasPermission = checkUserPermission(user, 'admin');

// ✅ Good - Function names describe action
function fetchUserData(userId: string) {}
function calculateTotalPrice(items: Item[]) {}

// ✅ Good - Boolean names
const isLoading = true;
const hasError = false;
const canEdit = true;

// ❌ Avoid - Single letter or unclear names
const d = new Date(); // Bad
const u = user; // Bad
````

### React Components

```typescript
// ✅ Good - Props interface naming
interface ButtonProps {}
interface UserCardProps {}

// ✅ Good - Event handler naming
const handleClick = () => {};
const handleSubmit = () => {};
const onUserSelect = () => {};

// ✅ Good - State variable naming
const [isOpen, setIsOpen] = useState(false);
const [userData, setUserData] = useState<User | null>(null);
```

## Component Patterns

### Container/Presentational Pattern

```typescript
// ✅ Good - Container component (handles logic)
function UserListContainer() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  return <UserList users={users} loading={loading} />;
}

// ✅ Good - Presentational component (handles display)
interface UserListProps {
  users: User[];
  loading: boolean;
}

function UserList({ users, loading }: UserListProps) {
  if (loading) return <Spinner />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Compound Components

```typescript
export const Card = ({ children }) => (
  <div className="card">{children}</div>
);

Card.Header = ({ children }) => (
  <div className="card-header">{children}</div>
);

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

## Performance Best Practices

### Code Splitting

```typescript
const ChatBot = lazy(() => import('./components/ChatBot'));
const DocumentationPage = lazy(() => import('./pages/Documentation'));
```

### Optimization

- React.memo for stable props
- useMemo for expensive computations
- useCallback for stable references
- Debounce inputs and scroll handlers
- Virtualize long lists
- Lazy load heavy components

### Three.js Performance

```typescript
useEffect(() => {
  const geometry = new THREE.BoxGeometry();
  return () => geometry.dispose();
}, []);

const starGeometry = useMemo(() => new THREE.SphereGeometry(0.1), []);
```

## Error Handling

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
}

async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader testing
- Color contrast

```tsx
<button aria-label="Close dialog" onClick={handleClose}>
  <CloseIcon aria-hidden="true" />
</button>
```

## Documentation

```typescript
/**
 * Calculates total price including tax
 * @param items Array of items
 * @param taxRate Tax rate as decimal
 * @returns Total with tax
 */
export function calculateTotalWithTax(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

Follow existing patterns for consistency.
