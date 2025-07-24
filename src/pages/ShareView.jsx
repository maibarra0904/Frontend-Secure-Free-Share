// frontend/src/pages/ShareView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';
import LoadingSpinner from '../components/LoadingSpinner';


const ShareView = () => {
    const { sharedLink } = useParams();
    const navigate = useNavigate();
    const [fileDetails, setFileDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [encryptionPassword, setEncryptionPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [authStep, setAuthStep] = useState(1); // Para manejar pasos de autenticación

    useEffect(() => {
        const fetchFileDetails = async () => {
            try {
                const response = await api.get(`/files/share/${sharedLink}`);
                setFileDetails(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch file details.');
                setLoading(false);
            }
        };
        fetchFileDetails();
    }, [sharedLink]);

    const handleCopyLink = async () => {
        const shareUrl = `${window.location.origin}/share/${sharedLink}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
            
            // SweetAlert2 toast para confirmación
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
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            
            // SweetAlert2 toast para confirmación (fallback)
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

    const handleDownload = async () => {
        setDownloading(true);
        setError('');
        
        // Validar paso a paso las credenciales requeridas
        const requiresPassword = fileDetails.requiresPassword || fileDetails.encrypted;
        
        if (requiresPassword && (!encryptionPassword || encryptionPassword.trim() === '')) {
            setError('Por favor ingresa la contraseña de cifrado.');
            setDownloading(false);
            setAuthStep(1); // Enfocar en el paso de contraseña
            return;
        }
        
        if (fileDetails.requires2FA && (!twoFactorCode || twoFactorCode.trim() === '')) {
            setError('Por favor ingresa el código de autenticación de dos factores (2FA).');
            setDownloading(false);
            setAuthStep(2); // Enfocar en el paso de 2FA
            return;
        }
        
        try {
            // Construct the download URL using the sharedLink
            let downloadUrl = `/files/download/${sharedLink}`;
            
            const params = new URLSearchParams();
            
            // Solo agregar password si es requerido Y está presente
            if (requiresPassword && encryptionPassword && encryptionPassword.trim() !== '') {
                params.append('password', encryptionPassword.trim());
            }
            
            // Solo agregar 2FA si es requerido Y está presente
            if (fileDetails.requires2FA && twoFactorCode && twoFactorCode.trim() !== '') {
                params.append('twoFactorCode', twoFactorCode.trim());
            }

            // Construct the final URL
            const finalUrl = params.toString() ? `${downloadUrl}?${params.toString()}` : downloadUrl;
            
            const response = await api.get(finalUrl, {
                responseType: 'blob', // Important for file downloads
            });

            // Extract filename from response headers or use the one from fileDetails
            let filename = fileDetails.filename;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            // Reset auth step on successful download
            setAuthStep(1);
            
            // Verificar si el archivo pertenece a un usuario no registrado y eliminarlo
            const shouldDeleteFile = !fileDetails.userEmail || fileDetails.userEmail === 'guest';
            
            if (shouldDeleteFile) {
                // Eliminar archivo de usuario no registrado después de la descarga
                try {
                    await api.delete(`/files/delete/${sharedLink}`);
                } catch {
                    // No mostrar error al usuario, es una operación en segundo plano
                }
            }
            
            // SweetAlert2 para éxito en descarga con redirección
            Swal.fire({
                icon: 'success',
                title: '¡Descarga exitosa!',
                text: shouldDeleteFile 
                    ? `El archivo "${filename}" se ha descargado correctamente. Como es un archivo de invitado, se ha eliminado automáticamente.`
                    : `El archivo "${filename}" se ha descargado correctamente.`,
                confirmButtonText: 'Continuar'
            }).then(() => {
                // Redirigir al login después de cerrar la alerta
                navigate('/login');
            });
        } catch (err) {
            if (err.response?.status === 404) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo no encontrado',
                    text: 'El archivo no existe o el enlace ha expirado.'
                });
            } else if (err.response?.status === 400) {
                // 400 Bad Request podría indicar password incorrecto
                const errorMessage = err.response?.data?.message || '';
                if (errorMessage.toLowerCase().includes('password') || 
                    errorMessage.toLowerCase().includes('contraseña') ||
                    errorMessage.toLowerCase().includes('incorrect') ||
                    errorMessage.toLowerCase().includes('invalid')) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Contraseña Incorrecta',
                        text: 'La contraseña ingresada no es correcta. Inténtalo de nuevo.'
                    });
                    if (fileDetails.requiresPassword || fileDetails.encrypted) {
                        setEncryptionPassword('');
                        setAuthStep(1);
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en la solicitud',
                        text: err.response?.data?.message || 'La solicitud no es válida.'
                    });
                }
            } else if (err.response?.status === 401) {
                // 401 también podría indicar password incorrecto dependiendo del backend
                const errorMessage = err.response?.data?.message || '';
                if (errorMessage.toLowerCase().includes('password') || 
                    errorMessage.toLowerCase().includes('contraseña') ||
                    errorMessage.toLowerCase().includes('incorrect') ||
                    errorMessage.toLowerCase().includes('invalid')) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Contraseña Incorrecta',
                        text: 'La contraseña ingresada no es correcta. Inténtalo de nuevo.'
                    });
                    if (fileDetails.requiresPassword || fileDetails.encrypted) {
                        setEncryptionPassword('');
                        setAuthStep(1);
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'No autorizado',
                        text: 'No tienes permisos para descargar este archivo.'
                    });
                }
            } else if (err.response?.status === 403) {
                // Verificar si es un error específico de contraseña incorrecta
                const errorMessage = err.response?.data?.message || '';
                if (errorMessage.toLowerCase().includes('password') || 
                    errorMessage.toLowerCase().includes('contraseña') ||
                    errorMessage.toLowerCase().includes('incorrect') ||
                    errorMessage.toLowerCase().includes('invalid')) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Contraseña Incorrecta',
                        text: 'La contraseña ingresada no es correcta. Inténtalo de nuevo.'
                    });
                    // Solo limpiar el password, mantener el 2FA si ya fue ingresado
                    if (fileDetails.requiresPassword || fileDetails.encrypted) {
                        setEncryptionPassword('');
                        setAuthStep(1); // Volver al paso de contraseña
                    }
                } else if (errorMessage.toLowerCase().includes('2fa') || 
                          errorMessage.toLowerCase().includes('two factor')) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Código 2FA Incorrecto',
                        text: 'El código de autenticación de dos factores no es válido.'
                    });
                    // Solo limpiar el 2FA
                    if (fileDetails.requires2FA) {
                        setTwoFactorCode('');
                        setAuthStep(2); // Mantener en el paso de 2FA
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Credenciales incorrectas',
                        text: 'Por favor verifica la contraseña y/o código 2FA e inténtalo de nuevo.'
                    });
                    // Reset fields on authentication failure
                    if (fileDetails.requiresPassword || fileDetails.encrypted) setEncryptionPassword('');
                    if (fileDetails.requires2FA) setTwoFactorCode('');
                    setAuthStep(1);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al descargar',
                    text: err.response?.data?.message || 'Ocurrió un error inesperado al descargar el archivo.'
                });
            }
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner size="large" text="Cargando detalles del archivo..." />;
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar</h2>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!fileDetails) {
        return <div className="text-center text-gray-600">File not found.</div>;
    }

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Archivo Compartido: {fileDetails.filename}</h2>
            
            {/* Share Link Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Enlace de Compartición</h3>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/share/${sharedLink}`}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700"
                    />
                    <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            copied 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {copied ? '¡Copiado!' : 'Copiar'}
                    </button>
                </div>
                {fileDetails.expirationDate && (
                    <p className="text-sm text-gray-600 mt-2">
                        Expira el: {new Date(fileDetails.expirationDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
            </div>

            {/* Download Section */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Descargar Archivo</h3>
                {fileDetails.size && (
                    <p className="text-gray-700 mb-2">Tamaño: {(fileDetails.size / (1024 * 1024)).toFixed(2)} MB</p>
                )}
                
                {/* Security Requirements Info */}
                {(fileDetails.requiresPassword || fileDetails.encrypted || fileDetails.requires2FA) && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">🔐 Este archivo requiere autenticación:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            {(fileDetails.requiresPassword || fileDetails.encrypted) && (
                                <li className="flex items-center">
                                    <span className={`mr-2 ${authStep >= 1 && encryptionPassword ? '✅' : '🔒'}`}></span>
                                    Contraseña de cifrado
                                </li>
                            )}
                            {fileDetails.requires2FA && (
                                <li className="flex items-center">
                                    <span className={`mr-2 ${authStep >= 2 && twoFactorCode ? '✅' : '🔐'}`}></span>
                                    Código de autenticación de dos factores (2FA)
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {/* Authentication Steps */}
            {(fileDetails.requiresPassword || fileDetails.encrypted) && (
                <div className={`mb-4 p-4 rounded-md border-2 ${authStep === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-2">1</span>
                        <label htmlFor="password" className="text-gray-700 text-sm font-bold">
                            Contraseña de Cifrado:
                        </label>
                    </div>
                    <input
                        type="password"
                        id="password"
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${authStep === 1 ? 'border-blue-500' : 'border-gray-300'}`}
                        value={encryptionPassword}
                        onChange={(e) => {
                            setEncryptionPassword(e.target.value);
                            if (e.target.value && authStep === 1) {
                                setAuthStep(2);
                                setError(''); // Clear error when user types
                            }
                        }}
                        placeholder="Ingresa la contraseña de cifrado"
                        autoFocus={authStep === 1}
                    />
                    {encryptionPassword && (
                        <p className="text-xs text-green-600 mt-1">✅ Contraseña ingresada</p>
                    )}
                </div>
            )}

            {fileDetails.requires2FA && (
                <div className={`mb-4 p-4 rounded-md border-2 ${authStep === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full mr-2">
                            {(fileDetails.requiresPassword || fileDetails.encrypted) ? '2' : '1'}
                        </span>
                        <label htmlFor="twoFactorCode" className="text-gray-700 text-sm font-bold">
                            Código 2FA:
                        </label>
                    </div>
                    <input
                        type="text"
                        id="twoFactorCode"
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${authStep === 2 ? 'border-blue-500' : 'border-gray-300'}`}
                        value={twoFactorCode}
                        onChange={(e) => {
                            setTwoFactorCode(e.target.value);
                            if (e.target.value) {
                                setError(''); // Clear error when user types
                            }
                        }}
                        placeholder="Ingresa el código 2FA (ej: 123456)"
                        maxLength="6"
                        autoFocus={authStep === 2 && !fileDetails.requiresPassword}
                    />
                    {twoFactorCode && (
                        <p className="text-xs text-green-600 mt-1">✅ Código 2FA ingresado</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Ingresa el código de 6 dígitos de tu aplicación de autenticación
                    </p>
                </div>
            )}

            {/* Download Button */}
            <button
                onClick={handleDownload}
                disabled={
                    downloading || 
                    ((fileDetails.requiresPassword || fileDetails.encrypted) && !encryptionPassword) || 
                    (fileDetails.requires2FA && !twoFactorCode)
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {downloading ? (
                    <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Descargando archivo...
                    </span>
                ) : (
                    <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar Archivo
                    </span>
                )}
            </button>
        </div>
    );
};

export default ShareView;