type ErrorItem = {
  code: string;
  message: string;
};

class CustomError extends Error {
  statusCode: number | string;
  errors?: ErrorItem[];

  constructor(statusCode: number | string, message: string, errors?: ErrorItem[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export default CustomError;
