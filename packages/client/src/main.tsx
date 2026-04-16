import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fcd34d',
            border: '1px solid #374151',
            fontFamily: 'Georgia, serif',
          },
          duration: 4000,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
