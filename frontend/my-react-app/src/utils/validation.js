// utils/validation.js

export const urlRegex =
  /^(https?:\/\/)?((([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,})|localhost)(:\d{1,5})?(\/.*)?$/i;

export const shortcodeRegex = /^[a-zA-Z0-9]{4,10}$/;

/**
 * Validates the URL input object.
 * @param {Object} input - The input object containing url, validity, shortcode.
 * @returns {Object|null} An object with error messages per field or null if valid.
 */
export function validateUrlInput(input) {
  const errors = {};

  if (!input.url.trim()) {
    errors.url = 'URL is required.';
  } else if (!urlRegex.test(input.url.trim())) {
    errors.url = 'Invalid URL format.';
  }

  if (input.validity) {
    if (!/^\d+$/.test(input.validity)) {
      errors.validity = 'Validity must be a positive integer.';
    } else if (Number(input.validity) <= 0) {
      errors.validity = 'Validity must be greater than zero.';
    }
  }

  if (input.shortcode) {
    if (!shortcodeRegex.test(input.shortcode.trim())) {
      errors.shortcode =
        'Shortcode must be 4-10 alphanumeric characters without spaces.';
    }
  }

  return Object.keys(errors).length ? errors : null;
}