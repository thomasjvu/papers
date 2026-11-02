import assert from 'node:assert/strict';
import { AsyncCache } from '../src/lib/asyncCache.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

export const asyncCacheTests = [
  {
    name: 'async cache shares pending work and caches missing values',
    run: async () => {
      const cache = new AsyncCache<null>();
      let loads = 0;
      const load = async () => {
        loads += 1;
        return null;
      };
      const first = cache.get('doc', load);
      assert.equal(cache.get('doc', load), first);
      assert.equal(await first, null);
      assert.equal(await cache.get('doc', load), null);
      assert.equal(loads, 1);
    },
  },
  {
    name: 'async cache ignores stale success and failure after clear',
    run: async () => {
      for (const fail of [false, true]) {
        const cache = new AsyncCache<string>();
        const old = deferred<string>();
        const current = deferred<string>();
        const oldRequest = cache.get('doc', () => old.promise);
        const oldOutcome = oldRequest.catch(() => 'rejected');
        await Promise.resolve();
        cache.clear();
        const currentRequest = cache.get('doc', () => current.promise);
        if (fail) old.reject(new Error('old failure'));
        else old.resolve('old');
        await oldOutcome;
        assert.equal(
          cache.get('doc', async () => 'unexpected'),
          currentRequest
        );
        current.resolve('new');
        assert.equal(await currentRequest, 'new');
        assert.equal(await cache.get('doc', async () => 'unexpected'), 'new');
      }
    },
  },
  {
    name: 'async cache retries rejected and synchronously throwing loaders',
    run: async () => {
      const cache = new AsyncCache<string>();
      await assert.rejects(
        cache.get('doc', () => {
          throw new Error('failed');
        }),
        /failed/
      );
      assert.equal(await cache.get('doc', async () => 'retried'), 'retried');
    },
  },
];
