# Developing Plugins

Build a plugin when profiles, skills, and MCP are not enough.

That is the whole threshold.

## Reach For A Plugin When You Need

- runtime lifecycle hooks
- tool registration inside the Phantasy runtime
- platform or provider integration
- storage or admin behavior that cannot live in prompts

If the task is just instructions, use `AGENTS.md` or a skill first.

## Scaffold

```bash
phantasy create plugin my-plugin --workspace operations --kind capability
cd plugins/my-plugin
npm install
npm run build
```

The scaffold lands under `./plugins/<slug>/`, which is the right place for trusted local development.

## Minimal Shape

```ts
import { BasePlugin, type PluginContext, type PluginTool } from '@phantasy/agent/plugins';

export class MyPlugin extends BasePlugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'Example plugin';
  protected workspace = 'operations' as const;
  protected extensionKind = 'capability' as const;

  async beforeChat(_context: PluginContext) {
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
            input: { type: 'string', description: 'Input value' },
          },
        },
        handler: async ({ input }) => ({ result: `Processed: ${input}` }),
      },
    ];
  }
}

export default MyPlugin;
```

## Design Rules

Prefer plugins that are:

- narrow
- explicit
- low-privilege by default
- honest about dependencies

Avoid plugins that:

- span multiple unrelated domains
- assume other plugins are present
- hide side effects in lifecycle hooks
- quietly expand the trust boundary

## Profiles Versus Plugins

Phantasy has two capability lanes:

1. first-party built-ins selected through `pluginProfiles`
2. explicit plugins for extra capability

A plugin should never assume it is part of the default runtime.

## Installation And Trust

Remote plugin installation is staged before enablement.

Practical implications:

- download is not the same as enablement
- staging does not auto-run lifecycle scripts
- staging does not auto-run `build`

If your plugin needs a build step, document it clearly.

## Good Default

Before writing a plugin, ask the boring question first:

- can this be an `AGENTS.md` rule?
- can this be a skill?
- can this be MCP?

If the answer is still no, then a plugin is probably the right tool.

## Related Docs

- [Plugin Overview](/docs/plugins/overview)
- [Integration Model](/docs/integrations/integrations-guide)
- [Runtime Packages](/docs/architecture/runtime-packages)
- [Design Principles](/docs/architecture/design-principles)
