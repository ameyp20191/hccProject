/**
 * Return text shortened to 21 characters.
 * @param {String} text - Text to be shortened
 * @returns {String} Shortened text
 */
function shortenText(text) {
  if (text.length > 21) {
    return text.substring(0, 18) + '..';
  }
  else {
    return text;
  }
}

