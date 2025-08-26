import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const InputField = ({
  type,
  placeholder,
  value,
  onChange,
  maxLength,
  pattern,
  title,
  className,
  readOnly,
  min,
  step,
  required,
  label,
}) => {
  // Handle date picker logic if type is "date"
  if (type === 'date') {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={(date) => onChange({ target: { value: date?.toISOString().split('T')[0] } })}
          placeholderText={placeholder}
          className={`w-full px-2 py-2 placeholder:text-sm text-md border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
          dateFormat="dd-MM-yyyy" // Matches your image format
          readOnly={readOnly}
          minDate={min ? new Date(min) : null}
          required={required}
        />
      </div>
    );
  }

  // Default input for other types
  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        readOnly={readOnly}
        min={min}
        step={step}
        required={required}
        className={`w-full px-2 py-2 placeholder:text-sm text-md border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
      />
    </div>
  );
};

InputField.propTypes = {
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
  pattern: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  readOnly: PropTypes.bool,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  required: PropTypes.bool,
  label: PropTypes.string,
};

InputField.defaultProps = {
  placeholder: '',
  value: '',
  maxLength: undefined,
  pattern: undefined,
  title: undefined,
  className: '',
  readOnly: false,
  min: undefined,
  step: undefined,
  required: false,
  label: '',
};

export default InputField;