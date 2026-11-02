# Runtime state transitions

Runtime components use named lifecycle states so loading, success, and failure
cannot be enabled independently.

| Owner               | States and transitions                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document page       | Initial loading or refreshing → ready, not found, or error. Refreshing keeps the previous document visible. Superseded requests cannot update the page.                                              |
| Markdown renderer   | Empty or processing → ready or failed. Processing keeps the previous result until its replacement is ready.                                                                                          |
| Mermaid             | Inline loading → ready or failed. Lightbox closed → loading → ready or failed → closed. A chart change closes the native dialog and clears its render.                                               |
| Documentation graph | Idle → selected → navigating → idle. Dragging is a separate idle/dragging state. Route changes and unmount cancel delayed navigation.                                                                |
| Pagefind            | Loading → available or unavailable. Initialization is shared; a later mount can retry after failure.                                                                                                 |
| Search              | Idle → searching → ready or failed. New searches clear old results and ignore superseded responses.                                                                                                  |
| API viewer          | Loading → mounted or failed. Configuration changes destroy the old viewer before loading another.                                                                                                    |
| Motion preference   | System-controlled → user-controlled when toggled. System changes apply only while system-controlled.                                                                                                 |
| Document cache      | Absent → pending → resolved, including missing documents. Failure returns to absent. Clear starts a new generation; older requests may settle for their callers but cannot write into the new cache. |

`src/lib/asyncCache.ts` owns request sharing and cache invalidation. Its regression
tests cover stale success, stale failure, retries, and cached missing values.
