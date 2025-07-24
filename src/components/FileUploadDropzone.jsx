// frontend/src/components/FileUploadDropzone.jsx
import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth.js';
import Swal from 'sweetalert2';
import LoadingSpinner from './LoadingSpinner';


const FileUploadDropzone = ({ onFileUploaded, userIsRegistered }) => {
    const { user, isAuthenticated } = useAuth();
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [encrypt, setEncrypt] = useState(false);
    const [password, setPassword] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleDragEnter = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            // Validar extensiones permitidas
            const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx'];
            const fileName = droppedFile.name.toLowerCase();
            const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExtension) {
                Swal.fire({
                    icon: 'error',
                    title: 'Tipo de archivo no permitido',
                    text: 'Solo se permiten archivos PDF, XLS, XLSX, DOC y DOCX.',
                    confirmButtonText: 'Entendido'
                });
                setFile(null);
                return;
            }
            
            // Validar tamaño antes de subir: 100KB para no registrados, 2MB para registrados
            const maxAllowedSize = userIsRegistered ? 2 * 1024 * 1024 : 100 * 1024;
            if (droppedFile.size > maxAllowedSize) {
                const maxSizeText = userIsRegistered ? '2 MB' : '100 KB';
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo demasiado grande',
                    text: `El tamaño del archivo excede el límite de ${maxSizeText}.`,
                    confirmButtonText: 'Entendido'
                });
                setFile(null);
                return;
            }
            setFile(droppedFile);
            setErrorMessage('');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validar extensiones permitidas
            const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx'];
            const fileName = selectedFile.name.toLowerCase();
            const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!isValidExtension) {
                Swal.fire({
                    icon: 'error',
                    title: 'Tipo de archivo no permitido',
                    text: 'Solo se permiten archivos PDF, XLS, XLSX, DOC y DOCX.',
                    confirmButtonText: 'Entendido'
                });
                setFile(null);
                e.target.value = ''; // Limpiar el input
                return;
            }
            
            // Validar tamaño antes de subir: 100KB para no registrados, 2MB para registrados
            const maxAllowedSize = userIsRegistered ? 2 * 1024 * 1024 : 100 * 1024;
            if (selectedFile.size > maxAllowedSize) {
                const maxSizeText = userIsRegistered ? '2 MB' : '100 KB';
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo demasiado grande',
                    text: `El tamaño del archivo excede el límite de ${maxSizeText}.`,
                    confirmButtonText: 'Entendido'
                });
                setFile(null);
                e.target.value = ''; // Limpiar el input
                return;
            }
            setFile(selectedFile);
            setErrorMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            Swal.fire({
                icon: 'warning',
                title: 'No hay archivo seleccionado',
                text: 'Por favor selecciona un archivo para subir.'
            });
            return;
        }

        setUploading(true);
        setUploadMessage('');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('encrypt', encrypt);
        if (encrypt) {
            formData.append('password', password);
        }
        formData.append('requires2FA', requires2FA);
        
        // Solo agregar userEmail si el usuario está autenticado
        if (isAuthenticated && user?.email) {
            formData.append('userEmail', user.email);
        }

        try {
            const response = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // SweetAlert2 para éxito con información del archivo
            Swal.fire({
                icon: 'success',
                title: '¡Archivo subido exitosamente!',
                text: response.data?.message || 'Tu archivo se ha subido correctamente.',
                confirmButtonText: 'Genial'
            });
            
            setUploadMessage(response.data?.message || 'Archivo subido exitosamente');
            setFile(null);
            setPassword('');
            setEncrypt(false);
            setRequires2FA(false);
            if (onFileUploaded) {
                onFileUploaded(response.data); // Pasar los datos del archivo subido
            }
        } catch (error) {
            // SweetAlert2 para errores
            let errorTitle = 'Error al subir archivo';
            let errorText = 'Hubo un problema al subir tu archivo.';
            
            if (error.response?.status === 401) {
                errorTitle = 'No autorizado';
                errorText = 'Por favor inicia sesión para subir archivos.';
            } else if (error.response?.data?.message) {
                errorText = error.response.data.message;
            }
            
            Swal.fire({
                icon: 'error',
                title: errorTitle,
                text: errorText
            });
            
            setErrorMessage(error.response?.data?.message || 'Error al subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white shadow-sm relative">
            {/* Overlay de carga */}
            {uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                    <LoadingSpinner size="large" text="Subiendo tu archivo..." color="blue" />
                </div>
            )}
            
            <div
                className={`flex flex-col items-center justify-center p-8 transition-colors duration-200 ease-in-out ${
                    dragging ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.xls,.xlsx,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:underline">
                    {file ? file.name : 'Arrastra y suelta tu archivo aquí, o haz clic para seleccionar'}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                    Tamaño máximo: {userIsRegistered ? '2 MB (registrado)' : '100 KB (invitado)'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Formatos permitidos: PDF, XLS, XLSX, DOC, DOCX
                </p>
                {isAuthenticated && (
                    <p className="mt-1 text-xs text-green-600">
                        ✓ Conectado como: {user?.email}
                    </p>
                )}
                {!isAuthenticated && (
                    <p className="mt-1 text-xs text-orange-600">
                        ⚠ Subiendo como invitado (funcionalidad limitada)
                    </p>
                )}
            </div>

            {file && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-lg font-semibold mb-2">Detalles del Archivo:</h3>
                    <p>Nombre: {file.name}</p>
                    <p>Tamaño: {file.size < 1024 * 1024 
                        ? `${(file.size / 1024).toFixed(2)} KB` 
                        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                    </p>

                    <div className="mt-4 space-y-2 text-left">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={encrypt}
                                onChange={(e) => setEncrypt(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span>¿Cifrar archivo con contraseña?</span>
                        </label>
                        {encrypt && (
                            <input
                                type="password"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ingresa la contraseña de cifrado"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        )}

                        {/* <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={requires2FA}
                                onChange={(e) => setRequires2FA(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span>¿Requerir 2FA para acceder al archivo?</span>
                        </label> */}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-h-[44px]"
                    >
                        {uploading ? (
                            <span className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                Subiendo archivo...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Subir Archivo
                            </span>
                        )}
                    </button>
                </div>
            )}

            {uploadMessage && (
                <p className="mt-4 text-green-600">{uploadMessage}</p>
            )}
            {errorMessage && (
                <p className="mt-4 text-red-600">{errorMessage}</p>
            )}
        </div>
    );
};

export default FileUploadDropzone;