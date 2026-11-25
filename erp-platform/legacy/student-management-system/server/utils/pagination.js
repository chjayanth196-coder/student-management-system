const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const paginateQuery = ({ page, limit }) => {
  const p = Math.max(1, toInt(page, 1));
  const l = Math.min(200, Math.max(1, toInt(limit, 10)));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
};

module.exports = { paginateQuery };

