const Joi = require("joi");

const passwordValidation = Joi.string()
  .min(8) // Minimum length of 8 characters
  .max(20) // Maximum length of 20 characters
  .pattern(/^[a-zA-Z0-9!@#$%^&*(),.?":{}|<>_-]+$/) // Alphanumeric + special characters
  .regex(/[a-z]/) // At least one lowercase letter
  .regex(/[A-Z]/) // At least one uppercase letter
  .regex(/\d/) // At least one digit
  .regex(/[@$!%*?&]/) // At least one special character
  .required() // Password must be required
  .messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 20 characters",
    "string.pattern.base":
      "Password must contain uppercase, lowercase, numbers, and special characters",
    "any.required": "Password is required",
  });

const validateRegistration = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: passwordValidation,
  });

  return schema.validate(data);
};

const validatelogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};
module.exports = { validateRegistration, validatelogin };
