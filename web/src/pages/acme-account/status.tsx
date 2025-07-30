// statusMap.ts
import i18n from 'i18next';

export const getStatusMap = () => {
  const t = i18n.t;
  return {
    valid: { color: "green", label: t('acmeAccountPage.statusValid') },
    revoked: { color: "red", label: t('acmeAccountPage.statusRevoked') },
    deactivated: { color: "orange", label: t('acmeAccountPage.statusDeactivated') },
  };
};

export const statusMap = {
  valid: { color: "green", label: "valid" },
  revoked: { color: "red", label: "revoked" },
  deactivated: { color: "orange", label: "deactivated" },
};