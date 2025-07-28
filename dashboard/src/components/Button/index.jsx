import PropTypes from 'prop-types';

const Button = ({ onClick, children, className, disabled }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick} 
      className={`w-full p-2 rounded transition-opacity duration-300 opacity-90 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-100'
      } ${className}`}
      disabled={disabled} 
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  onClick: () => {},
  className: '',
  disabled: false,
};

export default Button;