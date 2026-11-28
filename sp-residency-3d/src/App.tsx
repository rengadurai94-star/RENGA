import { lazy, Suspense, useEffect, useState } from 'react';
import Site from './components/Site';

const DataEditor = lazy(() => import('./editor/DataEditor'));

const isEditorRoute = () => window.location.hash.startsWith('#/editor');

export default function App() {
  const [editor, setEditor] = useState(isEditorRoute);
  useEffect(() => {
    const on = () => setEditor(isEditorRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (editor) {
    return (
      <Suspense fallback={<div style={{ padding: 40 }}>Loading editor…</div>}>
        <DataEditor />
      </Suspense>
    );
  }
  return <Site />;
}
