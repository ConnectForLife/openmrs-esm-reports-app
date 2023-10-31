import React from "react";
import { useSession } from "@openmrs/esm-framework";
import cronstrue from "cronstrue";

interface ReportScheduleProps {
  schedule: string;
}

const ReportScheduleDescription: React.FC<ReportScheduleProps> = ({ schedule }) => {
  const session = useSession();
  const scheduleDescription = cronstrue.toString(schedule, { locale: session.locale, use24HourTimeFormat: true });
  return (
    <span>{scheduleDescription}</span>
  );
};

export default ReportScheduleDescription;
