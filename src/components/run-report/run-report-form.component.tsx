import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import styles from "./run-report-form.scss";
import { getCurrentSession, getLocations, getReportDefinitions, getReportDesigns, getReports, runReport } from "../reports.resource";
import { ReportDesign } from '../../types/report-design';
import { closeOverlay } from '../../hooks/useOverlay';
import { TableContainer,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  DataTable,
  Button,
  ButtonSet,
  Select,
  SelectItem,
  TextInput,
  DatePicker, 
  DatePickerInput,
  Loading,
  Pagination
} from "@carbon/react";
import { Session, isDesktop, showModal, showToast, useLayoutType, usePagination } from '@openmrs/esm-framework';
import { mutate } from 'swr';

const RunReportForm: React.FC = () => {
  const { t } = useTranslation();
  const [reportDesigns, setReportDesigns] = useState<Array<ReportDesign>>([]);
  const [reportUuid, setReportUuid] = useState('');
  const [renderModeUuid, setRenderModeUuid] = useState('');
  const [currentReport, setCurrentReport] = useState(null);
  const [reportParameters, setReportParameters] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

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
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const designs = await getReportDesigns(reportUuid);
        setReportDesigns(designs);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [reportUuid]);

  useEffect(() => {
    const paramTypes = currentReport?.parameters.map(param => param.type);
    const isAnyNotSupportedType = !paramTypes?.every(paramType => supportedParameterTypes.includes(paramType));
    const isAllValuesNotEmpty = currentReport?.parameters.every(parameter => !!reportParameters[parameter.name] && reportParameters[parameter.name] !== 'Invalid Date');

    if (!isAnyNotSupportedType && isAllValuesNotEmpty && reportUuid !== '' && renderModeUuid !== '') {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }

  }, [reportParameters, reportUuid, renderModeUuid]);

  const supportedParameterTypes = [
    'java.util.Date',
    'java.lang.String',
    'java.lang.Integer',
    'org.openmrs.Location'
  ];

  const { reportDefinitions } = getReportDefinitions();
  const { locations } = getLocations();
  const runningReports = getReports('processing');
  const tableRows = runningReports ? runningReports.data : [];
  const [pageSize, setPageSize] = useState(5);
  const { currentPage, results, goTo } = usePagination(tableRows, pageSize);
  const layout = useLayoutType();

  const tableHeaders = [
    { key: 'reportName', header: t('reportName', 'Report Name') },
    { key: 'evaluateCompleteDatetime', header: t('date', 'Date')},
    { key: 'parameters', header: t('parameters', 'Parameters')},
    { key: 'requestedBy', header: t('requestedBy', 'Requested by')},
    { key: 'requestedOn', header: t('requestedOn', 'Requested on')},
    { key: 'actions', header: t('actions', 'Actions')}
  ]

  function isCurrentUserTheSameAsReportRequestedByUser(reportRequestUuid: string) {
    const reportRequest = tableRows.find(tableRow => tableRow.id === reportRequestUuid);
    const requestedByUserUuid = reportRequest?.requestedByUserUuid;
    const currentUserUuid = currentSession?.user.uuid;

    return requestedByUserUuid === currentUserUuid;
  }

  function isSystemDeveloperUser() {
    const systemDeveloperRoleName = 'System Developer';

    return currentSession?.user?.roles.map(role => role.display).includes(systemDeveloperRoleName);
  }

  function renderParameterElementBasedOnType(parameter: any) {
    switch(parameter.type) {
      case 'java.util.Date':
        return (
          <div className={styles.runReportInnerDivElement}>
            <DatePicker 
              datePickerType="single"
              name={parameter.name}
              onChange={([date]) => handleOnDateChange(parameter.name, date)}
              dateFormat='Y-m-d'
              className={styles.datePicker}
            >
              <DatePickerInput 
                id={parameter.name}
                name={parameter.name}
                labelText={parameter.label}
                type="date"
              />
            </DatePicker>
          </div>
        );
      case 'java.lang.String':
      case 'java.lang.Integer':
        return (
          <div className={styles.runReportInnerDivElement}>
            <TextInput 
              id={parameter.name}
              name={parameter.name}
              labelText={parameter.label}
              className={styles.basicInputElement}
              onChange={e => handleOnChange(e)}
              value={reportParameters[parameter.name] ?? ''}
            />
          </div>
        );
      case 'org.openmrs.Location':
        return (
          <div className={styles.runReportInnerDivElement}>
            <Select
              id={parameter.name}
              name={parameter.name}
              labelText={parameter.label} 
              className={styles.basicInputElement}
              onChange={e => handleOnChange(e)}
              value={reportParameters[parameter.name] ?? ''}
            >
              <SelectItem value="" />
              {
                locations?.length > 0 && locations.map(location => (
                  <SelectItem key={location.uuid} text={location.display} value={location.uuid}>
                    {location.display}
                  </SelectItem>
                ))
              }
            </Select>
          </div>
        );
      default:
        return (
          <div className={styles.runReportInnerDivElement}>
            <span className={styles.unknownParameterTypeSpan}>
              {`Unknown parameter type: ${parameter.type} for parameter: ${parameter.label}`}
            </span>
          </div>
        );
    }
  }

  function handleOnChange(event) {
    const key = event.target.name;
    let value = null;
    if (event.target.type == 'checkbox') {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }

    setReportParameters((state) => ({...state, [key]: value}));
  }

  function handleOnDateChange(fieldName, dateValue) {
    const date = new Date(dateValue).toLocaleDateString();
    setReportParameters((state) => ({...state, [fieldName]: date}));
  }

  const handleRunReportButtonClick = useCallback(async (reportDefinitionUuid, renderModeUuid, reportParameters) => {
    runReport(reportDefinitionUuid, renderModeUuid, reportParameters)
      .then(() => {
        setTimeout(() => mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=ran`), 500);
        showToast({
          critical: true,
          kind: 'success',
          title: t('reportRunning', 'Report running'),
          description: t('reportRanSuccessfullyMsg', 'Report ran successfully'),
        });
      })
      .catch((error) => {
        showToast({
          critical: true,
          kind: 'error',
          title: t('reportRunningErrorMsg', 'Error while running the report'),
          description: t('reportRunningErrorMsg', 'Error while running the report'),
        });
      })
  }, []);

  function renderCancelButton(row) {
    if (isCurrentUserTheSameAsReportRequestedByUser(row.id) || isSystemDeveloperUser()) {
      return (
        <div>
          <Button 
            kind="ghost"
            onClick={() => launchCancelReportDialog(row.id)}
            className={styles.cancelActionButton}
          >
            {t('cancel', 'Cancel')}
          </Button>
        </div>
      )
    };
  }

  const launchCancelReportDialog = (reportRequestUuid: string) => {
    const dispose = showModal('cancel-report-modal', {
      closeModal: () => dispose(),
      reportRequestUuid,
      isDeleteModal: false
    });
  };

  return (
    <div className={styles.desktopRunReport}>
      <div className={styles.runReportInnerDivElement}>
        <Select 
          id="select-report" 
          className={styles.basicInputElement} 
          labelText={t('selectReportLabel', 'Report')} 
          onChange={e => {
            setReportUuid(e.target.value);
            setRenderModeUuid('');
            setCurrentReport(reportDefinitions.find(reportDefinition => reportDefinition.uuid === e.target.value));
            setReportParameters({});
          }}
        >
          <SelectItem value=""/>
          {
            reportDefinitions?.length > 0 && reportDefinitions.map(reportDefinition => (
              <SelectItem key={reportDefinition.uuid} text={reportDefinition.name} value={reportDefinition.uuid}>
                {reportDefinition.name}
              </SelectItem>
            ))
          }
        </Select>
      </div>
      <div id="reportParametersDiv">
        {
          currentReport && currentReport.parameters?.map(parameter => (
            <div>
              {renderParameterElementBasedOnType(parameter)}
            </div>
          ))
        }
      </div>
      <div className={styles.outputFormatDiv}>
        <Select 
          id="output-format-select" 
          className={styles.basicInputElement} 
          labelText={t('outputFormat', 'Output format')}
          onChange={e => setRenderModeUuid(e.target.value)}
        >
          <SelectItem value=""/>
          {
            reportDesigns?.length > 0 && reportDesigns.map(reportDesign => (
              <SelectItem key={reportDesign.uuid} text={reportDesign.name} value={reportDesign.uuid}>
                {reportDesign.name}
              </SelectItem>
            ))
          }
        </Select>
      </div>
      <div id="runningOrQueuedReportsDiv">
        <div className={styles.runningOrQueuedReportsDivTitle}>
          <h4 className={styles.tableHeader}>{t('queuedOrRunning', 'Queued or Running')}</h4>
          <span className={styles.tableIcon}>
            <Loading small={true} withOverlay={false} />
          </span>
        </div>
        <DataTable rows={results} headers={tableHeaders}>
          {
            ({ rows, headers }) => (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader>
                          {header.header?.content ?? header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow>
                        {row.cells.map((cell) => (
                          <TableCell className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
                            {
                              cell.info.header === 'actions' ? (
                                <div>
                                  {renderCancelButton(row)}
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
          backwardText="Previous page"
          forwardText="Next page"
          page={currentPage}
          pageSize={pageSize}
          pageSizes={[5, 10, 20, 50, 100]}
          totalItems={tableRows?.length}
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
      <div className={styles.buttonsDiv}>
        <ButtonSet className={styles.buttonsGroup}>
          <Button 
            onClick={closeOverlay} 
            kind="secondary" 
            size="xl"
            className={styles.reportButton}
          >
            {t('cancel', 'Cancel')}
          </Button>
          <Button
            disabled={!isFormValid}
            onClick={() => handleRunReportButtonClick(reportUuid, renderModeUuid, reportParameters)}
            size="xl"
            className={styles.reportButton}
          >
            {t('run', 'Run')}
          </Button>
        </ButtonSet>
      </div>
    </div>
  );
};

export default RunReportForm;