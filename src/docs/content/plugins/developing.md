# Developing Plugins

Phantasy uses a WordPress-inspired plugin architecture, but the runtime now treats plugins and built-in capabilities differently:

- the trusted core stays small
- first-party capability bundles load through `capabilities`
- plugins extend the runtime when built-in capabilities are not enough

## When To Build A Plugin

Build a plugin when you need one or more of these:

- runtime lifecycle hooks
- tool registration
- platform integration
- provider or storage integration
- admin/runtime behavior that should not live in prompts or skills

Do not build a plugin for simple instructions. Use `AGENTS.md` or a skill first.

## Scaffold

Start from the packaged scaffold:

```bash
phantasy create plugin my-plugin --workspace operations --kind capability
cd plugins/my-plugin
npm install
npm run build
```

## Minimal Example

```ts
import { BasePlugin, type PluginContext, type PluginTool } from '@phantasy/agent/plugins';

export class MyPlugin extends BasePlugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'Example plugin';
  protected workspace = 'operations' as const;
  protected extensionKind = 'capability' as const;

  async beforeChat(context: PluginContext) {
    return { shouldContinue: true };
  }

  getTools(): PluginTool[] {
    return [
      {
        name: 'my_tool',
        description: 'Does something useful',
        parameters: {
          type: 'object',
          required: ['input'],
          properties: {
            input: {
              type: 'string',
              description: 'Input value',
            },
          },
        },
        handler: async ({ input }) => ({ result: `Processed: ${input}` }),
      },
    ];
  }
}

export default MyPlugin;
```

## Loading Model

Phantasy now has two plugin paths:

1. Built-in plugins selected through first-party capabilities
2. External plugins loaded explicitly from config or package sources

That means a plugin should not assume it is part of the default runtime.

## Plugin Responsibilities

A good plugin should:

- own one capability boundary
- register only the tools it actually needs
- keep config localized
- avoid assuming unrelated plugins are present
- fail safely when optional services are unavailable

## Installation And Trust

Remote plugin installation is staged and verified before enablement.

Important implications:

- remote install does not auto-run lifecycle scripts during staging
- remote install does not auto-run `build`
- enablement is a separate step from download

If your plugin requires a build step, document it clearly for maintainers and package consumers. Do not assume the runtime will execute it automatically.

For trusted local development, keep the compiled plugin under `./plugins/<slug>/`. The CLI scaffold targets that path directly.

## Config Guidance

Use capabilities for first-party capability selection:

```json
{
  "capabilities": { "coding": true, "character": true, "admin": false }
}
```

Use explicit plugin config only for extra capability beyond the selected built-in capabilities.

## Design Rules

Prefer:

- narrow tool surfaces
- explicit config
- low-privilege defaults
- composable behavior

Avoid:

- large multi-domain plugins
- implicit global state
- hidden side effects in lifecycle hooks
- assuming admin/server surfaces are always present

## Related Docs

- [Plugin Overview](./overview.md)
- [Runtime Packages](../architecture/runtime-packages.md)
- [Design Principles](../architecture/design-principles.md)
- [Agent Compatibility](../architecture/agent-compatibility.md)
