import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parse, format, isValid } from 'date-fns';

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
    // Parse value to Date object, supporting both dd-MM-yyyy and ISO formats, default to null if invalid
    let selectedDate = null;
    if (value) {
      try {
        // Try parsing as dd-MM-yyyy first
        selectedDate = parse(value, 'dd-MM-yyyy', new Date());
        if (!isValid(selectedDate)) {
          // Fall back to ISO format (yyyy-MM-dd) if dd-MM-yyyy fails
          selectedDate = parse(value, 'yyyy-MM-dd', new Date());
        }
        if (!isValid(selectedDate)) {
          console.warn('Invalid date value in InputField:', value);
          selectedDate = null;
        }
      } catch (e) {
        console.warn('Error parsing date value in InputField:', value, e);
        selectedDate = null;
      }
    }

    return (
      <div className="flex flex-col">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            if (date && isValid(date)) {
              const formattedDate = format(date, 'yyyy-MM-dd'); // Ensure YYYY-MM-DD format for backend
              onChange({ target: { value: formattedDate } });
            } else {
              onChange({ target: { value: '' } });
            }
          }}
          placeholderText={placeholder}
          className={`w-full px-2 py-2 placeholder:text-sm text-md border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
          dateFormat="dd-MM-yyyy" // UI display remains dd-MM-yyyy
          readOnly={readOnly}
          minDate={min ? (isValid(parse(min, 'dd-MM-yyyy', new Date())) ? parse(min, 'dd-MM-yyyy', new Date()) : parse(min, 'yyyy-MM-dd', new Date())) : null}
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