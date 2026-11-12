import { twMerge } from "tailwind-merge";
const variantClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500",
  secondary: "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500",
  warning: "bg-amber-500 text-slate-900 hover:bg-amber-400 focus-visible:ring-amber-400",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-indigo-500",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400"
};
const sizeClasses = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-[15px]"
};
const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5"
};
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  onClick,
  type = "button",
  className = ""
}) => <button
  type={type}
  className={twMerge(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  disabled={disabled || loading}
  onClick={onClick}
>
    {loading && <svg
  className="h-4 w-4 shrink-0 animate-spin"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  aria-hidden="true"
>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>}

    {Icon && iconPosition === "left" && !loading && <Icon className={iconSizeClasses[size]} aria-hidden="true" />}

    {children}

    {Icon && iconPosition === "right" && !loading && <Icon className={iconSizeClasses[size]} aria-hidden="true" />}
  </button>;
var Button_default = Button;
export {
  Button_default as default
};
