import React from 'react';
import Calendar from '../components/Calendar';
import { CalendarDays, Filter, Download } from 'lucide-react';

export default function CalendarPage({
  calendarSchedule,
  onUpdateCalendarSchedule,
  activeTimer,
  activities,
  timesheetRows,
  projects,
  currentUser,
  onAddManualEntry,
  onDeleteCalendarEntry
}) {
  return (
    <div className="page-container">
      {/* Calendar Component */}
      <Calendar
        currentUser={currentUser}
        calendarSchedule={calendarSchedule}
        onUpdateCalendarSchedule={onUpdateCalendarSchedule}
        activeTimer={activeTimer}
        activities={activities}
        timesheetRows={timesheetRows}
        projects={projects}
        onAddManualEntry={onAddManualEntry}
        onDeleteCalendarEntry={onDeleteCalendarEntry}
      />
    </div>
  );
}
