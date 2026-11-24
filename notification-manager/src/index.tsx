/// <reference types="@commercetools-frontend/application-config/client" />

import { createRoot } from 'react-dom/client';
import EntryPoint from './components/entry-point';

// React 19 removed ReactDOM.render; createRoot is the supported entry point.
const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app element');
}
createRoot(container).render(<EntryPoint />);
