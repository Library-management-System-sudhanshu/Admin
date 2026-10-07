import { lazy, type ComponentType } from 'react';

/** A failed chunk can be retried inside the page boundary without reloading the app. */
export function lazyPage(importer: () => Promise<{ default: ComponentType }>) {
  const load = () => importer().catch((error: unknown) => {
    Page = lazy(load);
    throw error;
  });
  let Page = lazy(load);
  return function LazyPage() { return <Page />; };
}
