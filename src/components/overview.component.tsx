import { TableContainer,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  DataTable,
  Button,
  Pagination,
  Checkbox
} from "@carbon/react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { getCurrentSession, getReports, preserveReport } from "./reports.resource";
import { Play, 
  Calendar, 
  Download, 
  Save, 
  TrashCan
} from '@carbon/react/icons';
import styles from './reports.scss';
import { ExtensionSlot, Session, isDesktop, showToast, useLayoutType, usePagination } from "@openmrs/esm-framework";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from "./pagination-constants";
import { launchOverlay } from "../hooks/useOverlay";
import RunReportForm from "./run-report/run-report-form.component";
import Overlay from "./overlay.component";
import ReportStatus from "./report-status.component";
import { COMPLETED, SAVED } from "./report-statuses-constants";
import ReportOverviewButton from "./report-overview-button.component";
import { mutate } from 'swr';

const OverviewComponent: React.FC = () => {
  const { t } = useTranslation();

  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getCurrentSession();
        setCurrentSession(session);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  let [checkedReportUuidsArray, setCheckedReportUuidsArray] = useState([]);
  const [downloadReportButtonVisible, setDownloadReportButtonVisible] = useState(false);

  const tableHeaders = [
    { key: 'reportName', header: t('reportName', 'Report Name') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'requestedBy', header: t('requestedBy', 'Requested by') },
    { key: 'requestedOn', header: t('requestedOn', 'Requested on') },
    { key: 'outputFormat', header: t('outputFormat', 'Output format') },
    { key: 'parameters', header: t('parameters', 'Parameters') },
    { key: 'actions', header: t('actions', 'Actions') }
  ];

  const ranReports = getReports('ran');
  const extractedData = ranReports ? ranReports.data : [];

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { currentPage, results, goTo } = usePagination(extractedData, pageSize);
  const layout = useLayoutType();

  function getReportStatus(row) {
    return row?.cells.find(cell => cell.info?.header === 'status')?.value;
  }

  function isCurrentUserTheSameAsReportRequestedByUser(reportRequestUuid: string) {
    const report = extractedData.find(tableRow => tableRow.id === reportRequestUuid);
    const requestedByUserUuid = report?.requestedByUserUuid;
    const currentUserUuid = currentSession?.user.uuid;

    return requestedByUserUuid === currentUserUuid;
  }

  function isSystemDeveloperUser() {
    const systemDeveloperRoleName = 'System Developer';

    return currentSession?.user?.roles.map(role => role.display).includes(systemDeveloperRoleName);
  }

  function isEligibleReportUser(reportRequestUuid: string) {
    return isCurrentUserTheSameAsReportRequestedByUser(reportRequestUuid) || isSystemDeveloperUser();
  }

  function renderRowCheckbox(row, index) {
    const statusCell = row?.cells.find(cell => cell.info?.header === 'status');
    const statusValue = statusCell?.value;
    if (statusValue === COMPLETED || statusValue === SAVED) {
      return (
        <td className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
          <Checkbox 
            id={`checkbox-${row.id}`}
            onChange={e => handleOnCheckboxClick(e)}
          />
        </td>
      );
    } else {
      return (
        <td className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}></td>
      )
    }
  }

  function handleOnCheckboxClick(event) {
    const checkboxElement = event?.target;
    const checkboxId = checkboxElement.id;
    const reportUuid = checkboxId.slice(checkboxId.indexOf('-') +1);
    const isChecked = checkboxElement?.checked;

    if (isChecked) {
      checkedReportUuidsArray.push(reportUuid);
    } else {
      checkedReportUuidsArray = checkedReportUuidsArray.filter(checkedReportUuid => checkedReportUuid !== reportUuid);
    }
    
    setDownloadReportButtonVisible(checkedReportUuidsArray.length > 0);
    setCheckedReportUuidsArray(checkedReportUuidsArray);
  }

  const handlePreserveReport = useCallback(async (reportRequestUuid: string) => {
    preserveReport(reportRequestUuid)
      .then(() => {
        mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=ran`);
        showToast({
          critical: true,
          kind: 'success',
          title: t('preserveReport', 'Preserve report'),
          description: t('reportPreservedSuccessfully', 'Report preserved successfully')
        });
      })
      .catch(error => {
        showToast({
          critical: true,
          kind: 'error',
          title: t('preserveReport', 'Preserve report'),
          description: t('reportPreservingErrorMsg', 'Error during report preserving')
        });
      })
  }, []);

  return (
    <div>
      <ExtensionSlot name="breadcrumbs-slot" className={styles.breadcrumb}/>
      <div className={styles.mainPanelDiv}>
        <div className={styles.reportsLabelDiv}>
          <h3>
          {t("reports", "Reports")}
          </h3>
        </div>
        <div className={styles.mainActionButtonsDiv}>
        <Button
          kind="ghost"
          renderIcon={() => <Download size={16} style={{ fill: '#0F62FE'}} className={styles.actionButtonIcon} />}
          iconDescription="Download reports"
          onClick={() => console.log('download reports click')}
          className={`${styles.mainActionButton} ${downloadReportButtonVisible ? styles.downloadReportsVisible : styles.downloadReportsHidden}`}
        >
          {t('downloadReports', 'Download reports')}
        </Button>
        <Button
          kind="ghost"
          renderIcon={() => <Play size={16} style={{ fill: '#0F62FE'}} className={styles.actionButtonIcon} />}
          iconDescription="Run reports"
          onClick={() => {
            launchOverlay(
              t('runReport', 'Run Report'), 
              <RunReportForm />
            );
          }}
          className={styles.mainActionButton}
        >
          {t('runReports', 'Run reports')}
        </Button>
        <Overlay />
        <Button
          kind="ghost"
          renderIcon={() => <Calendar size={16} style={{ fill: '#0F62FE'}} className={styles.actionButtonIcon} />}
          iconDescription="Report schedule"
          onClick={() => console.log('report schedule click')}
          className={styles.mainActionButton}
        >
          {t('reportSchedule', 'Report schedule')}
        </Button>
      </div>
      </div>
      <DataTable rows={results} headers={tableHeaders} isSortable>
        {
          ({ rows, headers }) => (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <th></th>
                    {headers.map((header) => (
                      <TableHeader>
                        {header.header?.content ?? header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow className={styles.tableRow}>
                      {renderRowCheckbox(row, index)}
                      {row.cells.map((cell) => (
                        <TableCell className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
                          {
                          cell.info.header === 'actions' ? (
                            <div>
                              <ReportOverviewButton
                                shouldBeDisplayed={getReportStatus(row) === COMPLETED || getReportStatus(row) === SAVED}
                                label={t('download', 'Download')}
                                icon={() => <Download size={16} className={styles.actionButtonIcon} />}
                                reportRequestUuid={row.id}
                                onClick={() => console.log('download button click')}
                              />
                              <ReportOverviewButton
                                shouldBeDisplayed={getReportStatus(row) === COMPLETED && isEligibleReportUser(row.id)}
                                label={t('preserve', 'Preserve')}
                                icon={() => <Save size={16} className={styles.actionButtonIcon} />}
                                reportRequestUuid={row.id}
                                onClick={() => handlePreserveReport(row.id)}
                              />
                              <ReportOverviewButton
                                shouldBeDisplayed={isEligibleReportUser(row.id)}
                                label={t('delete', 'Delete')}
                                icon={() => <TrashCan size={16} className={styles.actionButtonIcon} />}
                                reportRequestUuid={row.id}
                                onClick={() => console.log('delete button click')}
                              />
                            </div>
                          ) : cell.info.header === 'status' ? (
                              <div>
                                <ReportStatus status={cell.value}/>
                              </div>
                            ) : cell.info.header === 'reportName' ? (
                              <div>
                                {cell.value?.content ?? cell.value}
                              </div>
                            ) : cell.value?.content ?? cell.value
                          }
                      </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        }
      </DataTable>
      <Pagination 
        backwardText={t('previousPage', 'Previous page')}
        forwardText={t('nextPage', 'Next page')}
        page={currentPage}
        pageSize={pageSize}
        pageSizes={DEFAULT_PAGE_SIZES}
        totalItems={extractedData?.length}
        size={isDesktop(layout) ? 'sm' : 'lg'}
        onChange={({ pageSize: newPageSize, page: newPage }) => {
          if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
          }

          if (newPage !== currentPage) {
            goTo(newPage);
          }
        }}
      />
    </div>
  );
};

export default OverviewComponent;
