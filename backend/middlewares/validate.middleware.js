import Joi from "joi";

export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: error.details.map((item) => item.message)
    });
  }

  req.body = value;
  return next();
};

export const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: error.details.map((item) => item.message)
    });
  }

  req.params = value;
  return next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      data: error.details.map((item) => item.message)
    });
  }

  req.query = value;
  return next();
};
