import { registerRootComponent } from 'expo';
import App from './App';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    document.body.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;white-space:pre-wrap;background:#000;min-height:100vh">${e.message}\n\n${e.error?.stack ?? ''}</div>`;
  });
}

registerRootComponent(App);
