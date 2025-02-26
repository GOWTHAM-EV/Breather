import React from 'react';
import ReactDOM from 'react-dom/client';
import BoxBreathing from './App';  // The component above
import './index.css';              // Optional global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BoxBreathing />
  </React.StrictMode>
);
