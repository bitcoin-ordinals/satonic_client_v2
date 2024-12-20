"use client"

import { Button, Modal } from 'antd';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnisatInstallModal({ isOpen, onClose }: Props) {
  const handleInstall = () => {
    window.location.href = "https://unisat.io";
  };

  return (
    <Modal
      title="Install Unisat Wallet"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="install" type="primary" onClick={handleInstall}>
          Install Unisat Wallet
        </Button>
      ]}
    >
      <p>You need to install Unisat Wallet to use this application.</p>
    </Modal>
  );
} 