// Keep module resolution compatible with workspace-hoisted Vite installations.
// The npm entry point supplies enough heap for the optional API viewer's module graph.
import { build } from 'vite';

await build();
