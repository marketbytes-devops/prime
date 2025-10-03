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
  accept,
}) => {
  if (type === 'file') {
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const maxSize = 1 * 1024 * 1024; 
        if (file.size > maxSize) {
          alert('File size exceeds 1 MB limit. Please upload a smaller file.');
          e.target.value = ''; 
          onChange({ target: { files: null } }); 
          e.target.focus(); 
          return;
        }
      }
      onChange(e); 
    };

    return (
      <div className="flex flex-col">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} (Upload 1 MB)
          </label>
        )}
        <input
          type="file"
          accept={accept || '.pdf,.jpg,.jpeg,.png'} 
          onChange={handleFileChange}
          className={`w-full px-2 py-2 placeholder:text-sm text-md border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
          readOnly={readOnly}
          required={required}
        />
      </div>
    );
  }

  if (type === 'date') {
    let selectedDate = null;
    if (value) {
      try {
        selectedDate = parse(value, 'dd-MM-yyyy', new Date());
        if (!isValid(selectedDate)) {
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
              const formattedDate = format(date, 'yyyy-MM-dd');
              onChange({ target: { value: formattedDate } });
            } else {
              onChange({ target: { value: '' } });
            }
          }}
          placeholderText={placeholder}
          className={`w-full px-2 py-2 placeholder:text-sm text-md border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
          dateFormat="dd-MM-yyyy"
          readOnly={readOnly}
          minDate={min ? (isValid(parse(min, 'dd-MM-yyyy', new Date())) ? parse(min, 'dd-MM-yyyy', new Date()) : parse(min, 'yyyy-MM-dd', new Date())) : null}
          required={required}
        />
      </div>
    );
  }

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
        onWheel={type === 'number' ? (e) => e.target.blur() : undefined}
        onKeyDown={type === 'number' ? (e) => {
          if (e.keyCode === 38 || e.keyCode === 40) {
            e.preventDefault();
          }
        } : undefined}
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
  accept: PropTypes.string, 
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
  accept: undefined, 
};

export default InputField;