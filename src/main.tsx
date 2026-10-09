import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'katex/dist/katex.min.css';
import './styles.css';

class RenderBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="boot-screen"><h1>Let’s try that again.</h1><p>The page couldn’t be displayed. Your saved progress is still in this browser.</p><button className="button primary" onClick={() => window.location.reload()}>Reload the page</button></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><RenderBoundary><App /></RenderBoundary></React.StrictMode>);
