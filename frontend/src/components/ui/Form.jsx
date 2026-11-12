const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  options = [],
  rows = 3,
  className = ""
}) => {
  const baseInputClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200";
  const errorClasses = error ? "border-red-300" : "border-gray-300";
  const inputClasses = `${baseInputClasses} ${errorClasses} ${className}`;
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={inputClasses}
        />;
      case "select":
        return <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClasses}
        >
            <option value="">Select an option</option>
            {options.map((option) => <option key={option.value} value={option.value}>
                {option.label}
              </option>)}
          </select>;
      default:
        return <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />;
    }
  };
  return <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>;
};
const Form = ({ children, onSubmit, className = "" }) => {
  return <form onSubmit={onSubmit} className={className}>
      {children}
    </form>;
};
var Form_default = Form;
export {
  Form,
  FormField,
  Form_default as default
};
