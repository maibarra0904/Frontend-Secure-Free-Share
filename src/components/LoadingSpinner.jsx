// frontend/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
    size = 'medium', 
    text = 'Cargando...', 
    color = 'blue', 
    fullScreen = false,
    showText = true 
}) => {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12',
        xlarge: 'h-16 w-16'
    };

    const colorClasses = {
        blue: 'border-blue-600',
        green: 'border-green-600',
        red: 'border-red-600',
        gray: 'border-gray-600',
        white: 'border-white'
    };

    const textSizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
        xlarge: 'text-xl'
    };

    const containerClass = fullScreen 
        ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
        : 'flex flex-col items-center justify-center py-8';

    return (
        <div className={containerClass}>
            <div className="flex flex-col items-center space-y-4">
                {/* Spinner */}
                <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]} border-opacity-75`}></div>
                
                {/* Loading text */}
                {showText && (
                    <p className={`${textSizeClasses[size]} text-gray-600 font-medium animate-pulse`}>
                        {text}
                    </p>
                )}
                
                {/* Dots animation */}
                {showText && (
                    <div className="flex space-x-1">
                        <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                        <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                        <div className={`w-2 h-2 bg-${color}-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingSpinner;
