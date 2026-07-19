const normalizeDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const buildDateRange = ({ startDate, endDate }) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  if (!start || !end) return null;

  // inclusive end date
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  return { $gte: start, $lte: end };
};

module.exports = { buildDateRange };

