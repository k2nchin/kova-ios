import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ScrollText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, type WelcomeConfig } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import type { Server } from '../../types';
import '../../styles/community.css';

/** Shown the first time you enter a space with a welcome screen: message, rules, questions. */
export const WelcomeFlow: React.FC<{ server: Server }> = ({ server }) => {
  const { refreshServers } = useApp();
  const [config, setConfig] = useState<(WelcomeConfig & { completed: boolean }) | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getWelcome(server.id).then((value) => { if (alive) setConfig(value); }).catch(() => undefined);
    return () => { alive = false; };
  }, [server.id]);

  if (!config || !config.enabled || config.completed || closed) return null;

  const steps = ['welcome', ...(config.rules.length ? ['rules'] : []), ...config.questions.map((q) => q.id)];
  const current = steps[step];
  const question = config.questions.find((q) => q.id === current);
  const isLast = step === steps.length - 1;

  const finish = async () => {
    setBusy(true);
    try {
      const result = await api.completeOnboarding(server.id, answers);
      toast.success(result.roles.length ? `¡Listo! Tienes ${result.roles.length} rol${result.roles.length === 1 ? '' : 'es'} nuevo${result.roles.length === 1 ? '' : 's'}.` : `¡Bienvenido a ${server.name}!`);
      setClosed(true);
      void refreshServers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la bienvenida.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (questionId: string, optionId: string, multi: boolean) => setAnswers((prev) => {
    const picked = prev[questionId] || [];
    const next = picked.includes(optionId) ? picked.filter((id) => id !== optionId) : multi ? [...picked, optionId] : [optionId];
    return { ...prev, [questionId]: next };
  });

  const canContinue = current !== 'rules' || !config.requireAccept || accepted;

  return createPortal(
    <div className="kwel-overlay">
      <section className="kwel" role="dialog" aria-modal="true" aria-label={`Bienvenida a ${server.name}`}>
        {server.banner ? <div className="kwel-banner" style={{ backgroundImage: `url(${server.banner})` }} /> : <div className="kwel-banner is-empty" />}
        <div className="kwel-body">
          <div className="kwel-progress" aria-hidden="true">{steps.map((id, index) => <i key={id} className={index <= step ? 'is-on' : ''} />)}</div>

          {current === 'welcome' && (
            <>
              <Sparkles size={22} className="kwel-icon" />
              <h2>Te damos la bienvenida a {server.name}</h2>
              <p className="kwel-text">{config.message || server.description || 'Nos alegra tenerte aquí.'}</p>
            </>
          )}

          {current === 'rules' && (
            <>
              <ScrollText size={22} className="kwel-icon" />
              <h2>Normas del espacio</h2>
              <ol className="kwel-rules">{config.rules.map((rule, index) => <li key={index}><b>{index + 1}</b><span>{rule}</span></li>)}</ol>
              {config.requireAccept && (
                <label className="kwel-accept">
                  <input type="checkbox" checked={accepted} onChange={() => setAccepted(!accepted)} />
                  He leído y acepto las normas
                </label>
              )}
            </>
          )}

          {question && (
            <>
              <h2>{question.question}</h2>
              <p className="kwel-text">{question.multi ? 'Elige todas las que quieras.' : 'Elige una.'} Te daremos acceso a lo que te interesa.</p>
              <div className="kwel-options">
                {question.options.map((option) => {
                  const on = (answers[question.id] || []).includes(option.id);
                  return (
                    <button key={option.id} type="button" className={on ? 'is-on' : ''} onClick={() => toggle(question.id, option.id, question.multi)} aria-pressed={on}>
                      {option.emoji && <span className="kwel-emoji">{option.emoji}</span>}
                      <span>{option.label}</span>
                      {on && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <footer className="kwel-actions">
            {step > 0 && <button type="button" className="kwel-ghost" onClick={() => setStep(step - 1)}>Atrás</button>}
            {!config.requireAccept && step === 0 && <button type="button" className="kwel-ghost" onClick={() => void finish()}>Saltar</button>}
            <button type="button" className="kwel-primary" disabled={!canContinue || busy} onClick={() => (isLast ? void finish() : setStep(step + 1))}>
              {isLast ? 'Entrar al espacio' : 'Continuar'}
            </button>
          </footer>
        </div>
      </section>
    </div>,
    document.body,
  );
};
