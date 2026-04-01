import React, { useState } from 'react';
import './ActivityCalendar.css';

const ActivityCalendar = ({ history }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
  
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  
  const days = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ padded: true, key: `pad-start-${i}` });
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Check history object sent from backend mapping 'YYYY-MM-DD' to completion count
    const completions = history ? (history[dateStr] || 0) : 0;
    
    days.push({ 
      padded: false, 
      date: d, 
      dateStr,
      completions,
      isActive: completions >= 3,
      key: `day-${d}`
    });
  }
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[month];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="activity-calendar">
      <div className="calendar-header">
        <h3 className="section-title">Daily Quests Activity Calendar</h3>
        <div className="calendar-navigation">
          <button className="nav-btn" onClick={handlePrevMonth}>&larr;</button>
          <h4>{currentMonthName} {year}</h4>
          <button className="nav-btn" onClick={handleNextMonth}>&rarr;</button>
        </div>
      </div>
      <div className="calendar-grid">
        <div className="weekday-header">Sun</div>
        <div className="weekday-header">Mon</div>
        <div className="weekday-header">Tue</div>
        <div className="weekday-header">Wed</div>
        <div className="weekday-header">Thu</div>
        <div className="weekday-header">Fri</div>
        <div className="weekday-header">Sat</div>
        
        {days.map((day) => (
          <div 
            key={day.key} 
            className={`calendar-day ${day.padded ? 'padded' : ''} ${!day.padded ? (day.isActive ? 'active-day' : 'inactive-day') : ''}`}
            title={!day.padded ? `${day.dateStr}: ${day.completions} daily quests completed` : ''}
          >
            {!day.padded && <span>{day.date}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityCalendar;
