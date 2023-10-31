import React from "react";
import { Edit, TrashCan } from '@carbon/react/icons';
import { userHasAccess, useSession } from "@openmrs/esm-framework";
import ReportStatus from "./report-status.component";
import ReportScheduleDescription from "./report-schedule-description.component";
import NextReportExecution from "./next-report-execution.component";
import ReportOverviewButton from "./report-overview-button.component";
import { useTranslation } from "react-i18next";
import styles from "./reports.scss";
import { PRIVILEGE_SYSTEM_DEVELOPER } from "../constants";

interface ScheduledOverviewCellContentProps {
  cell: { info: { header: string }, value: any }
}

const ScheduledOverviewCellContent: React.FC<ScheduledOverviewCellContentProps> = ({ cell }) => {
  const { t } = useTranslation();
  const session = useSession();

  const renderContent = () => {
    switch (cell.info.header) {
      case 'actions':
        return (
          <div>
            <ReportOverviewButton
              shouldBeDisplayed={userHasAccess(PRIVILEGE_SYSTEM_DEVELOPER, session.user)}
              label={t('edit', 'Edit')}
              icon={() => <Edit size={16} className={styles.actionButtonIcon}/>} reportRequestUuid={null}
              onClick={() => {
              }}/>
            <ReportOverviewButton
              shouldBeDisplayed={userHasAccess(PRIVILEGE_SYSTEM_DEVELOPER, session.user)}
              label={t('deleteSchedule', 'Delete Schedule')}
              icon={() => <TrashCan size={16} className={styles.actionButtonIcon}/>}
              reportRequestUuid={null} onClick={() => {
            }}/>
          </div>
        );
      case 'status':
        return <ReportStatus status={cell.value}/>;
      case 'reportName':
        return <div>{cell.value?.content ?? cell.value}</div>;
      case 'schedule':
        return <ReportScheduleDescription schedule={cell.value}/>;
      case 'nextRun':
        return <NextReportExecution schedule={cell.value} currentDate={new Date()}/>;
      default:
        return <span>{cell.value?.content ?? cell.value}</span>;
    }
  };

  return renderContent();
};

export default ScheduledOverviewCellContent;
