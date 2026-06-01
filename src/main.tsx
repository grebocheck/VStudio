import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import Overlay from './Overlay.tsx';
import './index.css';
import { I18nProvider } from './i18n/index.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// The OBS overlay is a chrome-free standalone page; everything else is the studio.
const isOverlay = window.location.pathname.replace(/\/$/, '') === '/overlay';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isOverlay ? (
        <Overlay />
      ) : (
        <ThemeProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </ThemeProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
