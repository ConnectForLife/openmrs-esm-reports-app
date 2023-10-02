import React, { useCallback, useState } from 'react';
import { ModalBody, 
  Button,
  ModalFooter, 
  ModalHeader, 
  InlineLoading } from "@carbon/react";
import { useTranslation } from "react-i18next";
import { cancelReportRequest } from '../reports.resource';
import { showToast } from '@openmrs/esm-framework';
import { mutate } from 'swr';

interface CancelReportModalProps {
  closeModal: () => void;
  reportRequestUuid: string;
}

const CancelReportModal: React.FC<CancelReportModalProps> = ({ closeModal, reportRequestUuid }) => {
  const { t } = useTranslation();
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelReportRequest(reportRequestUuid)
      .then(() => {
        mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=processing`);
        mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=ran`);
        closeModal();
        showToast({
          critical: true,
          kind: 'success',
          title: t('cancelReport', 'Cancel report'),
          description: t('reportCanceledSuccessfully', 'Report canceled successfully')
        });
      })
      .catch((error) => {
        showToast({
          critical: true,
          kind: 'error',
          title: t('cancelReport', 'Cancel report'),
          description: t('reportCancelingErrorMsg', 'Error during report canceling')
        });
      })
  }, [closeModal]);

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={t('cancelReport', 'Cancel report')} />
      <ModalBody>
        <p>{t('cancelReportModalText', 'Are you sure you want to cancel this report?')}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('no', 'No')}
        </Button>
        <Button kind="danger" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? (
            <InlineLoading description={t('canceling', 'Canceling') + '...'} />
          ) : (
            <span>{t('yes', 'Yes')}</span>
          )}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default CancelReportModal;