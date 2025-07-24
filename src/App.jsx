// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ShareView from './pages/ShareView';
import FileUploadDropzone from './components/FileUploadDropzone';
import Swal from 'sweetalert2';

function AppContent() {
    const { isAuthenticated, logout } = useAuth();
    const [uploadedFile, setUploadedFile] = useState(null);

    const handleFileUploaded = (fileData) => {
        setUploadedFile(fileData);
    };

    const handleCopyLink = async (sharedLink) => {
        const shareUrl = `${window.location.origin}/share/${sharedLink}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            Swal.fire({
                icon: 'success',
                title: '¡Enlace copiado!',
                text: 'El enlace se ha copiado al portapapeles',
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        } catch {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            Swal.fire({
                icon: 'success',
                title: '¡Enlace copiado!',
                text: 'El enlace se ha copiado al portapapeles',
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            logout();
            Swal.fire({
                icon: 'success',
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-md p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold text-blue-600">SecureFreeShare</Link>
                    <div>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="mr-4 text-gray-700 hover:text-blue-600">Dashboard</Link>
                                <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mr-4 text-gray-700 hover:text-blue-600">Login</Link>
                                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-8">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Login />} />
                    <Route path="/share/:sharedLink" element={<ShareView />} />
                    <Route path="/" element={
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to SecureFreeShare</h1>
                            <p className="text-gray-600">Share your files securely and easily.</p>
                            {!isAuthenticated && (
                                <p className="mt-4">
                                    <Link to="/register" className="text-blue-600 hover:underline">Register now</Link> to get more benefits!
                                </p>
                            )}
                            <div className="mt-8">
                                <FileUploadDropzone 
                                    userIsRegistered={isAuthenticated} 
                                    onFileUploaded={handleFileUploaded}
                                />
                                
                                {/* Mostrar enlace del archivo subido solo para usuarios no registrados */}
                                {!isAuthenticated && uploadedFile && (
                                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            ¡Archivo subido exitosamente!
                                        </h3>
                                        <p className="text-green-700 mb-3">
                                            <strong>Archivo:</strong> {uploadedFile.filename}
                                        </p>
                                        
                                        {/* Mensaje de advertencia sobre eliminación automática */}
                                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div className="text-sm text-amber-800">
                                                    <p className="font-medium mb-1">⚠️ Importante:</p>
                                                    <p>Este archivo se eliminará automáticamente después de la primera descarga. Si necesitas múltiples descargas, considera <Link to="/register" className="text-amber-900 underline font-medium hover:text-amber-700">registrarte</Link> para obtener más beneficios.</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded border border-green-300">
                                            <p className="text-sm text-green-700 font-medium mb-2">Enlace para compartir:</p>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={`${window.location.origin}/share/${uploadedFile.sharedLink}`}
                                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700"
                                                />
                                                <button
                                                    onClick={() => handleCopyLink(uploadedFile.sharedLink)}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Copiar
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setUploadedFile(null)}
                                            className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
                                        >
                                            Subir otro archivo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    } />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;