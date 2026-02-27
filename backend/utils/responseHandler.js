export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, message, statusCode = 500, data = null) => {
  const payload = {
    success: false,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};
