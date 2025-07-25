import PropTypes from 'prop-types';

const Button = ({ onClick, children, className }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded transition-opacity duration-300 opacity-90 ${className}`}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Button.defaultProps = {
  onClick: () => { },
  className: '',
};

export default Button;