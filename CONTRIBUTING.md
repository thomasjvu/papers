# Contributing

Contributions welcome! Help make this documentation template better.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (see CODE_OF_CONDUCT.md).

## How to Contribute

### Issues

1. Check existing issues first
2. Use issue templates
3. Include: steps to reproduce, expected/actual behavior, environment

### Features

1. Open discussion first
2. Explain use case and benefits
3. Consider complexity

### Pull Requests

1. Fork and create branch:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Follow coding standards, update docs

3. Test changes:

   ```bash
   npm run dev
   npm run build
   npm run lint
   npm run type-check
   ```

4. Use conventional commits:

   ```bash
   git commit -m "feat: add feature"
   git commit -m "fix: resolve issue"
   ```

5. Push and create PR

### Commit Guidelines

[Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `chore:` Maintenance

### Development Setup

```bash
git clone https://github.com/your-username/papers.git
cd papers
npm install
cp .env.example .env.local
npm run dev
```

### Code Style

- TypeScript with proper types (no `any`)
- Functional components with hooks
- CSS variables for theming
- Small, focused components
- Absolute imports with `@/`

### Testing

- Test in development
- Verify production build
- Check responsive design
- Test light/dark themes

### Documentation

- Update README for setup changes
- Document new features
- JSDoc for complex functions
- Update .env.example for new variables

## Project Structure

```
app/
├── components/        # React components
├── lib/              # Utilities
├── providers/        # Contexts
└── docs/             # Documentation
public/               # Static assets
scripts/              # Build scripts
```

## Help

- [Discussions](https://github.com/thomasjvu/papers/discussions)
- [Documentation](https://papers.pages.dev)
- Issues (tag "question")

Contributors are recognized in README and release notes.
