export const generateState = (length) => {
  let text = "";

  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

export const buildQueryString = (queryParams) => {
  return Object.keys(queryParams)
    .filter((key) => {
      const value = queryParams[key];

      return typeof value !== "undefined" && value !== null;
    })
    .map((key) => {
      const value = queryParams[key];

      if (Array.isArray(value)) {
        return value
          .map((valueItem) => `${key}=${encodeURIComponent(valueItem)}`)
          .join("&");
      }

      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");
};
