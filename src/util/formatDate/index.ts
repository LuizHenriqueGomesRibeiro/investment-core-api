const formatDate = (input: string | number | Date): string => {
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
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}
  
export default formatDate;