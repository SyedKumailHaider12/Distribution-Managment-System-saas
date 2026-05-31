import { getAttendance } from './actions';
import { AttendanceClient } from './AttendanceClient';

export default async function AttendancePage() {
  const { employees, attendances, todayAttendances } = await getAttendance();
  return <AttendanceClient employees={employees} attendances={attendances} todayAttendances={todayAttendances} />;
}
