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
  isDeleteModal: boolean;
}

const CancelReportModal: React.FC<CancelReportModalProps> = ({ closeModal, reportRequestUuid, isDeleteModal }) => {
  console.log('isDeleteModal-->', isDeleteModal);
  const { t } = useTranslation();
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = useCallback(async () => {
    setIsCanceling(true);
    cancelReportRequest(reportRequestUuid)
      .then(() => {
        callMutates();
        closeModal();
        showToast({
          critical: true,
          kind: 'success',
          title: isDeleteModal ? t('deleteReport', 'Delete report') : t('cancelReport', 'Cancel report'),
          description: isDeleteModal ? t('reportDeletedSuccessfully', 'Report deleted successfully') : t('reportCanceledSuccessfully', 'Report canceled successfully')
        });
      })
      .catch(error => {
        showToast({
          critical: true,
          kind: 'error',
          title: isDeleteModal ? t('deleteReport', 'Delete report') : t('cancelReport', 'Cancel report'),
          description: isDeleteModal ? t('reportDeletingErrorMsg', 'Error during report deleting') : t('Error during report canceling')
        });
      })
  }, [closeModal]);

  const callMutates = () => {
    mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=ran`);
    if (!isDeleteModal) {
      mutate(`/ws/rest/v1/reportingrest/reportRequest?statusesGroup=processing`);
    }
  }

  return (
    <div>
      <ModalHeader closeModal={closeModal} title={isDeleteModal ? t('deleteReport', 'Delete report') : t('cancelReport', 'Cancel report')} />
      <ModalBody>
        <p>{isDeleteModal ? t('deleteReportModalText', 'Are you sure you want to delete this report?') : t('cancelReportModalText', 'Are you sure you want to cancel this report?')}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('no', 'No')}
        </Button>
        <Button kind="danger" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? (
            <InlineLoading description={isDeleteModal ? t('deleting', 'Deleting') : t('canceling', 'Canceling') + '...'} />
          ) : (
            <span>{t('yes', 'Yes')}</span>
          )}
        </Button>
      </ModalFooter>
    </div>
  );
};

export default CancelReportModal;