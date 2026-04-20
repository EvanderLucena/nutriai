import { useState, useEffect } from 'react';
import { IconX } from '../icons';

interface OptionTabProps {
  name: string;
  active: boolean;
  onClick: () => void;
  onRename: (name: string) => void;
  onRemove: (() => void) | null;
}

export function OptionTab({ name, active, onClick, onRename, onRemove }: OptionTabProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);

  useEffect(() => { setVal(name); }, [name]);

  const commit = () => {
    setEditing(false);
    if (val.trim()) onRename(val.trim());
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 6,
        border: active ? '1px solid var(--fg)' : '1px solid var(--border)',
        background: active ? 'var(--ink)' : 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onClick}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        style={{
          padding: '7px 12px',
          color: active ? 'var(--paper)' : 'var(--fg)',
          fontSize: 12.5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
        }}
      >
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setEditing(false); setVal(name); }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontSize: 12.5, fontFamily: 'var(--font-ui)', minWidth: 80 }}
          />
        ) : (
          name
        )}
      </button>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remover opção"
          style={{
            padding: '4px 8px',
            color: active ? 'rgba(255,255,255,0.5)' : 'var(--fg-subtle)',
            borderLeft: '1px solid ' + (active ? 'rgba(255,255,255,0.15)' : 'var(--border)'),
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = active ? 'var(--paper)' : 'var(--coral)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = active ? 'rgba(255,255,255,0.5)' : 'var(--fg-subtle)')}
        >
          <IconX size={11} />
        </button>
      )}
    </div>
  );
}