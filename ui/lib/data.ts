export const loadSchedule = async () => {
  const response = await fetch('/data/calendar.json');
  const data = await response.json();
  return data;
};
