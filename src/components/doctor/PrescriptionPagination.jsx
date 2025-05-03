import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PrescriptionPagination = ({ currentPage, itemsPerPage, totalItems, handlePageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Create array of page numbers
  const getPageNumbers = () => {
    const pages = [];
    
    // For smaller numbers of pages, show all
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // For larger numbers, show current page and neighbors
    pages.push(1); // Always show first page
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Show page before current if not first page
    if (currentPage > 2) {
      pages.push(currentPage - 1);
    }
    
    // Current page
    if (currentPage !== 1 && currentPage !== totalPages) {
      pages.push(currentPage);
    }
    
    // Show page after current if not last page
    if (currentPage < totalPages - 1) {
      pages.push(currentPage + 1);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    pages.push(totalPages); // Always show last page
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex justify-center mt-6">
      <nav className="flex items-center space-x-1" aria-label="Pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded transition-colors duration-200 ${
            currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded transition-colors duration-200 ${
                currentPage === page 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded transition-colors duration-200 ${
            currentPage === totalPages 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};

export default PrescriptionPagination;