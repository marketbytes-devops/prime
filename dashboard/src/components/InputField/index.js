import PropTypes from 'prop-types';

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
}) => {
  return (
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
      className={`w-full p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${className || ''}`}
    />
  );
};

InputField.propTypes = {
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
  pattern: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  readOnly: PropTypes.bool,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  required: PropTypes.bool,
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
};

export default InputField;