import i18n from 'i18next';

export const getStatusMap = () => {
  const t = i18n.t;
  return {
    issued: { color: "green", label: t('acmeCertPage.statusIssued') },
    expired: { color: "red", label: t('acmeCertPage.statusExpired') },
    not_issued: { color: "orange", label: t('acmeCertPage.statusNotIssued') },
    revoked: { color: "gray", label: t('acmeCertPage.statusRevoked') },
  };
};

export const statusMap = {
  issued: { color: "green", label: "issued" },
  expired: { color: "red", label: "expired" },
  not_issued: { color: "orange", label: "not_issued" },
  revoked: { color: "gray", label: "revoked" },
};
