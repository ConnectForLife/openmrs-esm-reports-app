import React, { useState } from "react";
import { ExtensionSlot, useLayoutType, usePagination, isDesktop } from "@openmrs/esm-framework";
import styles from "./reports.scss";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from "@carbon/react";
import { getReports } from "./reports.resource";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES } from "./pagination-constants";
import ScheduledOverviewCellContent from "./scheduled-overview-cell-content.component";

const ScheduledOverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const layout = useLayoutType();
  const scheduledReports = (() => {
    const reportsResponse = getReports('scheduled', 'name');
    return reportsResponse ? reportsResponse.data.map(row => ({...row, nextRun: row.schedule})) : [];
  })();
  const { currentPage, results, goTo } = usePagination(scheduledReports, pageSize);

  const tableHeaders = [
    { key: 'reportName', header: t('reportName', 'Report Name') },
    { key: 'status', header: t('status', 'Status') },
    { key: 'schedule', header: t('schedule', 'Schedule') },
    { key: 'nextRun', header: t('nextRun', 'Next run') },
    { key: 'actions', header: t('actions', 'Actions') }
  ];

  return (
    <div>
      <ExtensionSlot name="breadcrumbs-slot" className={styles.breadcrumb}/>
      <div className={styles.mainPanelDiv}>
        <div className={styles.reportsLabelDiv}>
          <h3>
            {t("scheduledReports", "Scheduld Reports")}
          </h3>
        </div>
        <div className={styles.mainActionButtonsDiv}>
        </div>
        <DataTable rows={results} headers={tableHeaders} isSortable={false}>
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
                      <TableRow className={styles.tableRow}>
                        {row.cells.map((cell) => (
                          <TableCell className={index % 2 == 0 ? styles.rowCellEven : styles.rowCellOdd}>
                            <ScheduledOverviewCellContent cell={cell} row={row} />
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
          totalItems={scheduledReports?.length}
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
    </div>
  );
};

export default ScheduledOverviewComponent;
