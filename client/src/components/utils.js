

//Utility functions
export function dateStringFormat(askDate, askedBy, askOrAnswer = 0) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - askDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInYears = now.getFullYear() - askDate.getFullYear();
  
    const paddedMinutes = String(askDate.getMinutes()).padStart(2, '0');
    const paddedHours = String(askDate.getHours()).padStart(2, '0');
    const monthName = askDate.toLocaleDateString('default', { month: 'short' });
  
    let formattedDate = `${monthName} ${askDate.getDate()}`;
    
    if (diffInYears !== 0) {
      formattedDate += `, ${askDate.getFullYear()}`;
    }
  
    let timeString;
  
    if (diffInHours < 24 && diffInDays === 0) {
      if (diffInMinutes < 60) {
        if (diffInSeconds < 60) timeString = `${diffInSeconds} seconds ago`;
        else timeString = `${diffInMinutes} minutes ago`;
      } else {
        timeString = `${diffInHours} hours ago`;
      }
    } else {
      timeString = `${formattedDate} at ${paddedHours}:${paddedMinutes}`;
    }
  
    if (askOrAnswer > 0) {
      return `${askedBy} answered ${timeString}`;
    }
    return `${askedBy} asked ${timeString}`;
  }
  
  export function extractUsernameAndDate(dateInfoStr) {    // helper to separate username and date parts of return value of dateStringFormat
    let splitStr;
    if (dateInfoStr.includes(' asked ')) {
        splitStr = dateInfoStr.split(' asked ');
        const username = splitStr[0];
        const datePart = " asked " + splitStr[1];
        return { username, datePart };
    } else {
        splitStr = dateInfoStr.split(' answered ');
        const username = splitStr[0];
        const datePart = " answered " + splitStr[1];
        return { username, datePart };
    }
  }
  
  
  export function convertHyperlinks(text) {
    const parts = text.split(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g);
    const jsxElements = [];
  
    for (let i = 0; i < parts.length; i += 3) {
      jsxElements.push(parts[i]);
      if (i + 1 < parts.length && i + 2 < parts.length) {
        jsxElements.push(
          <a key={i} href={parts[i + 2]} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>
            {parts[i + 1]}
          </a>
        );
      }
    }
    return jsxElements;
  }