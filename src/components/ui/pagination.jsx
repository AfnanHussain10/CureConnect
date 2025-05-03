"use client"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
  showFirstLast = true,
  maxVisiblePages = 5,
  size = "default",
  variant = "default",
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null

  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []

    // If total pages is less than or equal to max visible pages, show all pages
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
      return pageNumbers
    }

    // Always include first and last page
    const firstPage = 1
    const lastPage = totalPages

    // Calculate the range of pages to show around the current page
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(lastPage - 1, startPage + maxVisiblePages - 3)

    // Adjust if we're near the start or end
    if (startPage <= 2) {
      startPage = 2
      endPage = Math.min(lastPage - 1, startPage + maxVisiblePages - 3)
    }

    if (endPage >= lastPage - 1) {
      endPage = lastPage - 1
      startPage = Math.max(2, endPage - (maxVisiblePages - 3))
    }

    // Add first page
    pageNumbers.push(firstPage)

    // Add ellipsis if needed
    if (startPage > 2) {
      pageNumbers.push("ellipsis-start")
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    // Add ellipsis if needed
    if (endPage < lastPage - 1) {
      pageNumbers.push("ellipsis-end")
    }

    // Add last page if it's different from the first page
    if (lastPage !== firstPage) {
      pageNumbers.push(lastPage)
    }

    return pageNumbers
  }

  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 min-w-8 text-xs"
      case "lg":
        return "h-11 min-w-11 text-base"
      case "default":
      default:
        return "h-10 min-w-10 text-sm"
    }
  }

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case "outline":
        return "border border-gray-200 dark:border-gray-800"
      case "ghost":
        return "hover:bg-gray-100 dark:hover:bg-gray-800"
      case "default":
      default:
        return "bg-white dark:bg-gray-950 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900"
    }
  }

  const sizeClasses = getSizeClasses()
  const variantClasses = getVariantClasses()
  const pageNumbers = getPageNumbers()

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex justify-center items-center ${className}`}
    >
      <ul className="flex flex-wrap items-center gap-1">
        {/* Previous button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${sizeClasses} ${variantClasses} rounded-md flex items-center justify-center px-3 disabled:opacity-50 disabled:pointer-events-none`}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </button>
        </li>

        {/* Page numbers */}
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === "ellipsis-start" || pageNumber === "ellipsis-end") {
            return (
              <li key={pageNumber}>
                <span className={`${sizeClasses} flex items-center justify-center px-3 text-gray-400`}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More pages</span>
                </span>
              </li>
            )
          }

          const isActive = pageNumber === currentPage
          return (
            <li key={index}>
              <button
                onClick={() => onPageChange(pageNumber)}
                className={`${sizeClasses} ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
                    : variantClasses
                } rounded-md flex items-center justify-center px-3.5 font-medium`}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </button>
            </li>
          )
        })}

        {/* Next button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${sizeClasses} ${variantClasses} rounded-md flex items-center justify-center px-3 disabled:opacity-50 disabled:pointer-events-none`}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

// Also export sub-components for more granular usage
export const PaginationContent = ({ className, ...props }) => (
  <ul className={`flex flex-wrap items-center gap-1 ${className}`} {...props} />
)

export const PaginationItem = ({ className, ...props }) => <li className={className} {...props} />

export const PaginationLink = ({ className, isActive, size = "default", ...props }) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 min-w-8 text-xs"
      case "lg":
        return "h-11 min-w-11 text-base"
      default:
        return "h-10 min-w-10 text-sm"
    }
  }

  return (
    <button
      className={`${getSizeClasses()} ${
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
      } rounded-md flex items-center justify-center px-3.5 font-medium ${className}`}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  )
}

export const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink aria-label="Go to previous page" size="default" className={`gap-1 pl-2.5 ${className}`} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)

export const PaginationNext = ({ className, ...props }) => (
  <PaginationLink aria-label="Go to next page" size="default" className={`gap-1 pr-2.5 ${className}`} {...props}>
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)

export const PaginationEllipsis = ({ className, ...props }) => (
  <span className={`flex h-10 w-10 items-center justify-center text-gray-400 ${className}`} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)

// Default export for convenience
export default Pagination
