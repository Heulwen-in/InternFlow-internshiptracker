function toDate(value) {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
}

module.exports = { toDate };
