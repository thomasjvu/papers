/** A cleared cache never accepts results from an earlier generation. */
export class AsyncCache<T> {
  private entries = new Map<
    string,
    { status: 'pending'; request: Promise<T> } | { status: 'resolved'; value: T }
  >();
  private generation = 0;

  get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key);
    if (entry?.status === 'resolved') return Promise.resolve(entry.value);
    if (entry?.status === 'pending') return entry.request;

    const generation = this.generation;
    const request = Promise.resolve()
      .then(load)
      .then(
        (value) => {
          if (generation === this.generation) {
            this.entries.set(key, { status: 'resolved', value });
          }
          return value;
        },
        (error: unknown) => {
          if (generation === this.generation) this.entries.delete(key);
          throw error;
        }
      );
    this.entries.set(key, { status: 'pending', request });
    return request;
  }

  clear(): void {
    this.generation += 1;
    this.entries.clear();
  }
}
