export const validate = (schema) => {
  return (req, res, next) => {
    // Wrap single object in an array to unify processing
    const data = Array.isArray(req.body) ? req.body : [req.body];

    const errors = [];
    const validatedData = data.map((item, index) => {
      const { error, value } = schema.validate(item, { abortEarly: false });
      if (error) {
        errors.push({ index, details: error.details.map(d => d.message) });
      }
      return value;
    });

    if (errors.length) {
      return res.status(400).json({
        status: false,
        message: "Validation error",
        errors,
      });
    }

    // If original input was a single object, return a single object
    req.body = Array.isArray(req.body) ? validatedData : validatedData[0];
    next();
  };
};
