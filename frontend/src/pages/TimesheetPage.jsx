import React from 'react';
import TimesheetTable from '../components/TimesheetTable';
import { INITIAL_PROJECTS } from '../data/mockData';

export default function TimesheetPage({
  timesheetRows,
  onUpdateTimesheetRows,
  projects = INITIAL_PROJECTS,
  onCreateProject,
  searchQuery = '',
  activities = [],
  onAddManualEntry,
  onUpdateTimesheetCell,
  onDeleteProjectActivities,
  onUpdateProjectName,
  onDeleteActivity,
  currentUser = null,
  usersList = []
}) {
  return (
    <div className="clockodo-timesheet-page-container">
      {/* Main Timesheet Table (Clockodo Layout) */}
      <TimesheetTable
        timesheetRows={timesheetRows}
        onUpdateTimesheetRows={onUpdateTimesheetRows}
        projects={projects}
        onCreateProject={onCreateProject}
        searchQuery={searchQuery}
        activities={activities}
        onAddManualEntry={onAddManualEntry}
        onUpdateTimesheetCell={onUpdateTimesheetCell}
        onDeleteProjectActivities={onDeleteProjectActivities}
        onUpdateProjectName={onUpdateProjectName}
        onDeleteActivity={onDeleteActivity}
        currentUser={currentUser}
        usersList={usersList}
      />
    </div>
  );
}
