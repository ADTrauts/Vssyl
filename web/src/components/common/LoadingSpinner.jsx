export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <div className={`${sizeClass} animate-spin rounded-full border-solid border-gray-200 border-t-blue-600 ${className}`}></div>
  )
} 