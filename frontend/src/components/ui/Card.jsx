import { twMerge } from "tailwind-merge";
const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8"
};
const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-xl shadow-slate-200/60"
};
const Card = ({
  children,
  className = "",
  padding = "md",
  shadow = "md",
  border = true,
  hover = false
}) => <div
  className={twMerge(
    "rounded-2xl bg-white",
    paddingClasses[padding],
    shadowClasses[shadow] || "shadow-card",
    border ? "border border-slate-200" : "",
    hover ? "transition-shadow duration-200 hover:shadow-card-hover" : "",
    className
  )}
>
    {children}
  </div>;
var Card_default = Card;
export {
  Card_default as default
};
