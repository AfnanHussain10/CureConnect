import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-[420px] flex-col gap-3 p-4 sm:top-4 sm:right-4 sm:bottom-auto sm:flex-col",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-5 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full data-[state=open]:sm:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
        success: "border-green-100 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-300",
        destructive: "border-red-100 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-300",
        warning: "border-yellow-100 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        info: "border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-transparent px-4 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-600",
      "group-[.destructive]:border-red-200 group-[.destructive]:hover:border-red-300 group-[.destructive]:hover:bg-red-100 group-[.destructive]:focus:ring-red-400 dark:group-[.destructive]:border-red-700 dark:group-[.destructive]:hover:bg-red-800",
      "group-[.success]:border-green-200 group-[.success]:hover:border-green-300 group-[.success]:hover:bg-green-100 group-[.success]:focus:ring-green-400 dark:group-[.success]:border-green-700 dark:group-[.success]:hover:bg-green-800",
      "group-[.warning]:border-yellow-200 group-[.warning]:hover:border-yellow-300 group-[.warning]:hover:bg-yellow-100 group-[.warning]:focus:ring-yellow-400 dark:group-[.warning]:border-yellow-700 dark:group-[.warning]:hover:bg-yellow-800",
      "group-[.info]:border-blue-200 group-[.info]:hover:border-blue-300 group-[.info]:hover:bg-blue-100 group-[.info]:focus:ring-blue-400 dark:group-[.info]:border-blue-700 dark:group-[.info]:hover:bg-blue-800",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
      "group-[.destructive]:text-red-600 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-100 dark:group-[.destructive]:text-red-400",
      "group-[.success]:text-green-600 group-[.success]:focus:ring-green-400 group-[.success]:focus:ring-offset-green-100 dark:group-[.success]:text-green-400",
      "group-[.warning]:text-yellow-600 group-[.warning]:focus:ring-yellow-400 group-[.warning]:focus:ring-offset-yellow-100 dark:group-[.warning]:text-yellow-400",
      "group-[.info]:text-blue-600 group-[.info]:focus:ring-blue-400 group-[.info]:focus:ring-offset-blue-100 dark:group-[.info]:text-blue-400",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 mt-1 line-clamp-2", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// New toast icon component for visual enhancement
const ToastIcon = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
      "group-[.destructive]:bg-red-100 group-[.destructive]:text-red-600 dark:group-[.destructive]:bg-red-900 dark:group-[.destructive]:text-red-300",
      "group-[.success]:bg-green-100 group-[.success]:text-green-600 dark:group-[.success]:bg-green-900 dark:group-[.success]:text-green-300",
      "group-[.warning]:bg-yellow-100 group-[.warning]:text-yellow-600 dark:group-[.warning]:bg-yellow-900 dark:group-[.warning]:text-yellow-300",
      "group-[.info]:bg-blue-100 group-[.info]:text-blue-600 dark:group-[.info]:bg-blue-900 dark:group-[.info]:text-blue-300",
      "group-[.default]:bg-gray-100 group-[.default]:text-gray-600 dark:group-[.default]:bg-gray-700 dark:group-[.default]:text-gray-300",
      className
    )}
    {...props}
  />
));
ToastIcon.displayName = "ToastIcon";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};