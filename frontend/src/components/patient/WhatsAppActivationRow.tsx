import { useState } from 'react';
import type { Patient } from '../../types/patient';
import { IconWhatsapp, IconEdit } from '../icons';
import { useActivationLink } from '../../stores/whatsappStore';
import { useToastStore } from '../../stores/toastStore';

interface WhatsAppActivationRowProps {
  patient: Patient;
  patientId: string;
  onEditPatient: () => void;
}

export function WhatsAppActivationRow({
  patient,
  patientId,
  onEditPatient,
}: WhatsAppActivationRowProps) {
  const [copied, setCopied] = useState(false);
  const hasPhone = patient.whatsapp != null && patient.whatsapp !== '';
  const { data: activationData, isError, error } = useActivationLink(hasPhone ? patientId : null);
  const showSuccess = useToastStore((s) => s.showSuccess);

  const isActivated = activationData?.isActivated ?? false;
  const link = activationData?.link ?? '';

  const handleCopyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showSuccess('Link de ativação copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showSuccess('Link: ' + link);
    }
  };

  // State 1: No WhatsApp number registered
  if (!hasPhone) {
    return (
      <div
        style={{
          padding: '8px 28px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
          }}
        >
          <IconWhatsapp size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
          <span style={{ color: 'var(--fg-muted)' }}>WhatsApp: Número não cadastrado</span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '4px 8px' }}
          onClick={onEditPatient}
        >
          <IconEdit size={10} /> Editar paciente
        </button>
      </div>
    );
  }

  // State 2: WhatsApp activated (green dot)
  if (isActivated) {
    return (
      <div
        style={{
          padding: '8px 28px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
          }}
        >
          <IconWhatsapp size={16} style={{ color: 'var(--sage)', flexShrink: 0 }} />
          <span style={{ color: 'var(--fg)' }}>WhatsApp: Ativado</span>
          <span
            role="img"
            aria-label="WhatsApp ativado"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--sage)',
              display: 'inline-block',
            }}
          />
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '4px 8px' }}
          onClick={handleCopyLink}
        >
          {copied ? '✓ Copiado' : 'Copiar link'}
        </button>
      </div>
    );
  }

  // State 3: WhatsApp number exists but not yet activated (gray dot)
  // Distinguish 400 (missing phone) from other errors (network/500)
  if (isError) {
    const isMissingPhoneError =
      error != null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response != null &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 400;

    if (isMissingPhoneError) {
      return (
        <div
          style={{
            padding: '8px 28px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
            }}
          >
            <IconWhatsapp size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
            <span style={{ color: 'var(--fg-muted)' }}>WhatsApp: Número não cadastrado</span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={onEditPatient}
          >
            <IconEdit size={10} /> Editar paciente
          </button>
        </div>
      );
    }

    // Generic error (network, 500, timeout)
    return (
      <div
        style={{
          padding: '8px 28px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontFamily: 'var(--font-ui)',
          }}
        >
          <IconWhatsapp size={16} style={{ color: 'var(--coral)', flexShrink: 0 }} />
          <span style={{ color: 'var(--fg-muted)' }}>Erro ao carregar link. Tente novamente.</span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '4px 8px' }}
          onClick={onEditPatient}
        >
          <IconEdit size={10} /> Editar paciente
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '8px 28px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontFamily: 'var(--font-ui)',
        }}
      >
        <IconWhatsapp size={16} style={{ color: 'var(--fg-subtle)', flexShrink: 0 }} />
        <span style={{ color: 'var(--fg-muted)' }}>WhatsApp: Não ativado</span>
        <span
          role="img"
          aria-label="WhatsApp não ativado"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--fg-subtle)',
            display: 'inline-block',
          }}
        />
      </div>
      <button
        className="btn btn-ghost"
        style={{ fontSize: 11, padding: '4px 8px' }}
        onClick={handleCopyLink}
      >
        {copied ? '✓ Copiado' : 'Gerar link'}
      </button>
    </div>
  );
}
