import fetch from 'node-fetch';

interface Options {
  method?: string;
  data?: object;
  authorization?: string;
  cors?: boolean;
}

const request = async <T>(url: string, options: Options = {}): Promise<T> => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.authorization) {
    headers.Authorization = options.authorization;
  }

  const fetchOptions: { [key: string]: string | object } = {
    method: options.method,
    headers,
  };

  if (options.cors) {
    fetchOptions.mode = 'cors';
  }

  if (options.data) {
    fetchOptions.body = JSON.stringify(options.data);
  }

  const response = await fetch(url, fetchOptions);

  return response.json();
};

export default request;
