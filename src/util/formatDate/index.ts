const formatDate = (input: string | number | Date, format: string, lastDayMonth?: boolean): string => {
  let date: Date;

  if (typeof input === 'string') {
    date = new Date(input);
  } else if (typeof input === 'number') {
    date = new Date(input * 1000);
  } else {
    date = input;
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  if (lastDayMonth) {
    date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (format === 'dd/mm/yyyy') {
    return `${day}/${month}/${year}`;
  } else if (format === 'yyyy-mm-dd') {
    return `${year}-${month}-${day}`;
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
};

export default formatDate;