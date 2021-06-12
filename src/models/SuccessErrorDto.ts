export default class SuccessErrorDto<T = void> {
  constructor(d?: T) {
    this.data = d;
  }

  errorMessage: string;
  data: T;

  get error() {
    return !!this.errorMessage;
  }

  get success() {
    return !this.errorMessage;
  }

  set error(_) {
    this.errorMessage = 'Неопределенная ошибка';
  }

  toJSON() {
    return {
      error: this.error,
      data: this.data,
      errorMessage: this.errorMessage,
      success: this.success,
    };
  }
}
