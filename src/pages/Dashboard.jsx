import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import FileUploadDropzone from '../components/FileUploadDropzone.jsx';
import api from '../utils/api.js';
import Swal from 'sweetalert2';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { user } = useAuth();
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchUserFiles = useCallback(async () => {
    // Verificar que tengamos el token JWT antes de hacer la petición
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      setError('No se encontró token de autenticación');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userEmail = user?.email;
      if (!userEmail) {
        setError('No se pudo obtener el email del usuario');
        return;
      }
      
      const response = await api.get(`/files/my-files?userEmail=${encodeURIComponent(userEmail)}`);
      setUserFiles(response.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Token de autenticación inválido o expirado');
      } else {
        setError('Error al cargar tus archivos');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (user?.email && token) {
      fetchUserFiles();
    } else if (user?.email && !token) {
      setError('No se encontró token de autenticación');
      setLoading(false);
    }
  }, [user?.email, fetchUserFiles]);

  const handleFileUploaded = () => {
    // Refrescar la lista después de subir un archivo
    fetchUserFiles();
  };

  const handleCopyLink = async (sharedLink) => {
    const shareUrl = `${window.location.origin}/share/${sharedLink}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(sharedLink);
      setTimeout(() => setCopiedLink(null), 2000);
      
      // SweetAlert2 para confirmación de copiado
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
      setCopiedLink(sharedLink);
      setTimeout(() => setCopiedLink(null), 2000);
      
      // SweetAlert2 para confirmación de copiado (fallback)
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

  const handleDeleteFile = async (fileId) => {
    // SweetAlert2 para confirmación de eliminación
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    // Verificar que tengamos el token JWT
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'No se encontró token de autenticación'
      });
      return;
    }
    
    try {
      await api.delete(`/files/delete/${fileId}`);
      fetchUserFiles(); // Refrescar la lista
      
      // SweetAlert2 para éxito
      Swal.fire({
        icon: 'success',
        title: '¡Archivo eliminado!',
        text: 'El archivo se ha eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      // SweetAlert2 para errores
      let errorMessage = 'Error al eliminar el archivo';
      if (err.response?.status === 401) {
        errorMessage = 'Token de autenticación inválido o expirado';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-xl mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Bienvenido a SecureFreeShare, {user ? user.email : 'Guest'}!
              </h1>
              <p className="text-gray-700">
                Gestiona tus archivos compartidos de forma segura y sencilla.
              </p>
            </div>
            
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Subir Nuevo Archivo</h2>
          <FileUploadDropzone 
            userIsRegistered={true} 
            onFileUploaded={handleFileUploaded}
          />
        </div>

        {/* Files List Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Tus Archivos Compartidos</h2>
          
          {loading ? (
            <LoadingSpinner size="large" text="Cargando tus archivos..." />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchUserFiles}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          ) : userFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No tienes archivos compartidos aún.</p>
              <p className="text-gray-500 text-sm mt-2">Sube tu primer archivo usando el formulario de arriba.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userFiles.map((file) => {
                // Extraer el nombre del archivo sin el prefijo UUID
                const displayName = file.filename.includes('_') 
                  ? file.filename.split('_').slice(1).join('_') 
                  : file.filename;
                
                return (
                  <div key={file.fileId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{displayName}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>Tamaño: {file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}</p>
                          <p>Tipo: {file.contentType || 'N/A'}</p>
                          <p>Subido: {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}</p>
                          {file.expirationDate && (
                            <p>Expira: {new Date(file.expirationDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {file.requiresPassword && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                🔒 Protegido
                              </span>
                            )}
                            {file.requires2FA && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🔐 2FA
                              </span>
                            )}
                            {file.encrypted && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                🛡️ Cifrado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {/* Copy Frontend Link Button */}
                        <button
                          onClick={() => handleCopyLink(file.sharedLink)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            copiedLink === file.sharedLink 
                              ? 'bg-green-600 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {copiedLink === file.sharedLink ? '¡Copiado!' : 'Copiar Enlace'}
                        </button>
                        
                        {/* View Frontend Link Button */}
                        <a
                          href={`/share/${file.sharedLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Ver
                        </a>
                        
                        {/* Direct Download Link Button */}
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Descargar
                        </a>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteFile(file?.sharedLink)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    
                    {/* Links Display 
                    {/*
                    <div className="mt-3 space-y-2">
                      
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-700 font-medium mb-1">Enlace de compartición (Frontend):</p>
                        <code className="text-xs text-blue-800 break-all">
                          {`${window.location.origin}/share/${file.sharedLink}`}
                        </code>
                      </div>
                      
                      
                      <div className="p-3 bg-green-50 rounded-md">
                        <p className="text-xs text-green-700 font-medium mb-1">Enlace de descarga directa (API):</p>
                        <code className="text-xs text-green-800 break-all">
                          {file.downloadUrl}
                        </code>
                      </div>
                    </div>
                    */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;