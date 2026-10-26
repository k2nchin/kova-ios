import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, type OnboardingQuestion, type WelcomeConfig } from '../../services/apiClient';
import type { Role } from '../../types';

const MOD_PERMS = ['ADMINISTRATOR', 'MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES', 'MUTE_MEMBERS', 'MOVE_MEMBERS', 'MENTION_EVERYONE'];
const uid = () => Math.random().toString(36).slice(2, 8);

/** Space settings → Bienvenida: message, rules (optionally mandatory) and role-picking questions. */
export const WelcomePanel: React.FC<{ spaceId: string; roles: Role[] }> = ({ spaceId, roles }) => {
  const [config, setConfig] = useState<WelcomeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  // Onboarding can only hand out roles without moderation powers.
  const assignable = roles.filter((role) => !role.id.startsWith('role_everyone_') && !role.id.startsWith('role_owner_') && !(role.permissions || []).some((perm) => MOD_PERMS.includes(perm)));

  useEffect(() => {
    let alive = true;
    api.getWelcome(spaceId).then((value) => { if (alive) setConfig(value); }).catch(() => { if (alive) setConfig({ enabled: false, message: '', rules: [], requireAccept: false, questions: [] }); });
    return () => { alive = false; };
  }, [spaceId]);

  if (!config) return <p className="kwp-empty">Cargando…</p>;

  const update = (patch: Partial<WelcomeConfig>) => setConfig({ ...config, ...patch });
  const updateQuestion = (id: string, patch: Partial<OnboardingQuestion>) => update({ questions: config.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });

  const save = async () => {
    setSaving(true);
    try {
      const saved = await api.setWelcome(spaceId, { ...config, rules: config.rules.filter((rule) => rule.trim()) });
      setConfig(saved);
      toast.success('Bienvenida guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kwp">
      <label className="kwp-switch">
        <input type="checkbox" checked={config.enabled} onChange={() => update({ enabled: !config.enabled })} />
        <span><strong>Pantalla de bienvenida</strong><small>Se muestra a cada persona la primera vez que entra.</small></span>
      </label>

      <section>
        <h3>Mensaje</h3>
        <textarea value={config.message} onChange={(event) => update({ message: event.target.value })} rows={3} maxLength={1000} placeholder="¡Hola! Aquí hablamos de… Pásate por #presentaciones." />
      </section>

      <section>
        <h3>Normas</h3>
        {config.rules.map((rule, index) => (
          <div key={index} className="kwp-row">
            <b>{index + 1}</b>
            <input value={rule} onChange={(event) => update({ rules: config.rules.map((r, i) => (i === index ? event.target.value : r)) })} maxLength={300} placeholder="Ej.: Respeto ante todo" />
            <button type="button" onClick={() => update({ rules: config.rules.filter((_, i) => i !== index) })} aria-label={`Quitar norma ${index + 1}`}><Trash2 size={14} /></button>
          </div>
        ))}
        {config.rules.length < 20 && <button type="button" className="kwp-add" onClick={() => update({ rules: [...config.rules, ''] })}><Plus size={13} /> Añadir norma</button>}
        <label className="kwp-check">
          <input type="checkbox" checked={config.requireAccept} onChange={() => update({ requireAccept: !config.requireAccept })} />
          Obligar a aceptarlas antes de escribir (moderadores exentos)
        </label>
      </section>

      <section>
        <h3>Preguntas de onboarding</h3>
        <p className="kwp-help">Cada respuesta puede dar roles (solo roles sin poderes de moderación). Así cada persona ve los canales que le interesan.</p>
        {config.questions.map((question) => (
          <div key={question.id} className="kwp-question">
            <div className="kwp-row">
              <input value={question.question} onChange={(event) => updateQuestion(question.id, { question: event.target.value })} maxLength={150} placeholder="¿A qué juegas?" />
              <label className="kwp-check is-inline"><input type="checkbox" checked={question.multi} onChange={() => updateQuestion(question.id, { multi: !question.multi })} /> Varias</label>
              <button type="button" onClick={() => update({ questions: config.questions.filter((q) => q.id !== question.id) })} aria-label="Quitar pregunta"><Trash2 size={14} /></button>
            </div>
            {question.options.map((option) => (
              <div key={option.id} className="kwp-option">
                <input className="kwp-emoji" value={option.emoji} onChange={(event) => updateQuestion(question.id, { options: question.options.map((o) => (o.id === option.id ? { ...o, emoji: event.target.value.slice(0, 4) } : o)) })} placeholder="🎮" aria-label="Emoji" />
                <input value={option.label} onChange={(event) => updateQuestion(question.id, { options: question.options.map((o) => (o.id === option.id ? { ...o, label: event.target.value } : o)) })} maxLength={60} placeholder="Respuesta" />
                <div className="kwp-roles">
                  {assignable.length === 0 ? <small>Crea roles para asignarlos</small> : assignable.map((role) => {
                    const on = option.roleIds.includes(role.id);
                    return (
                      <button key={role.id} type="button" className={on ? 'is-on' : ''} onClick={() => updateQuestion(question.id, { options: question.options.map((o) => (o.id === option.id ? { ...o, roleIds: on ? o.roleIds.filter((id) => id !== role.id) : [...o.roleIds, role.id] } : o)) })}>
                        <i style={{ background: role.color }} />{role.name}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => updateQuestion(question.id, { options: question.options.filter((o) => o.id !== option.id) })} aria-label="Quitar respuesta"><Trash2 size={13} /></button>
              </div>
            ))}
            {question.options.length < 10 && <button type="button" className="kwp-add" onClick={() => updateQuestion(question.id, { options: [...question.options, { id: uid(), label: '', emoji: '', roleIds: [] }] })}><Plus size={13} /> Añadir respuesta</button>}
          </div>
        ))}
        {config.questions.length < 5 && (
          <button type="button" className="kwp-add" onClick={() => update({ questions: [...config.questions, { id: uid(), question: '', multi: true, options: [{ id: uid(), label: '', emoji: '', roleIds: [] }] }] })}>
            <Plus size={13} /> Añadir pregunta
          </button>
        )}
      </section>

      <div className="kwp-footer">
        <button type="button" className="kwp-save" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Guardar bienvenida'}</button>
      </div>
    </div>
  );
};
