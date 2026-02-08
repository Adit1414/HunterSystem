import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Test component mounting...');

function TestApp() {
    return (
        <div style={{ color: 'red', fontSize: '40px', padding: '50px' }}>
            <h1>TEST RENDER</h1>
            <p>If you see this, React is working.</p>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestApp />);
