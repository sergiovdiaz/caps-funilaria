// utils/dateUtils.js
export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateFromFilter = (dateString) => {
  if (!dateString) return getToday();
  const [year, month, day] = dateString.split("-");
  return new Date(year, month - 1, day);
};
