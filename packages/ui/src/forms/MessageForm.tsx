"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

/*
 * MessageForm: a complete form pattern, not just fields.
 *
 * - Validation runs on submit. Every invalid field gets `aria-invalid` and an
 *   error message tied to it with `aria-describedby`, and focus moves to the
 *   first one after the errors have rendered, so it is read out with its message.
 * - One polite live region, always mounted, says what happened: how many fields
 *   need attention, that details are being checked, that the message is being
 *   sent, that it was sent, or that it was not.
 * - A field can carry an asynchronous `check`, such as whether a link opens.
 *   Checks are cancelled if the form is submitted again or unmounted, time out,
 *   and let the message through when they cannot run at all.
 * - Sending is honest: the form only says "sent" when `onSend` resolved. A
 *   failure or a timeout keeps what was typed and can offer another way to reach
 *   you. The submit button keeps its width while its label changes.
 */

const CSS = `
.bz-mf{container-type:inline-size;color:var(--bz-ink,#0a0a0a);font-family:var(--bz-font-sans,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif)}
.bz-mf *,.bz-mf *::before,.bz-mf *::after{box-sizing:border-box}
.bz-mf-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
@container (min-width:520px){.bz-mf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bz-mf-field[data-span="half"]{grid-column:span 1}}
.bz-mf-field{grid-column:1/-1;display:flex;flex-direction:column;gap:6px}
.bz-mf-label{font-size:0.875rem;font-weight:600;line-height:1.4}
.bz-mf-req{margin-left:3px;color:var(--bz-danger,#b91c1c)}
.bz-mf-control{width:100%;min-height:48px;margin:0;padding:11px 14px;border:1px solid var(--bz-ink-disabled,#8a8a8e);border-radius:12px;background:var(--bz-paper,#ffffff);color:inherit;font:inherit;font-size:1rem;line-height:1.5;transition:border-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),box-shadow 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
textarea.bz-mf-control{min-height:120px;resize:vertical}
.bz-mf-control::placeholder{color:var(--bz-ink-subtle,#6b6b70)}
@media (hover:hover){.bz-mf-control:hover{border-color:var(--bz-ink-muted,#4a4a4c)}}
.bz-mf-control:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px;border-color:var(--bz-ink,#0a0a0a)}
.bz-mf-control[aria-invalid="true"]{border-color:var(--bz-danger-decor,#ef4444);box-shadow:inset 0 0 0 1px var(--bz-danger-decor,#ef4444)}
.bz-mf-hint{margin:0;font-size:0.8125rem;line-height:1.45;color:var(--bz-ink-subtle,#6b6b70)}
.bz-mf-error{display:flex;align-items:flex-start;gap:6px;margin:0;font-size:0.8125rem;font-weight:500;line-height:1.45;color:var(--bz-danger,#b91c1c)}
.bz-mf-error svg{flex:none;width:14px;height:14px;margin-top:2px}
.bz-mf-check{display:flex;align-items:center;gap:6px;min-height:1.2em;margin:0;font-size:0.8125rem;font-weight:500;line-height:1.45;color:var(--bz-ink-muted,#4a4a4c)}
.bz-mf-check:empty{display:none}
.bz-mf-check[data-result="ok"]{color:var(--bz-emerald,#047857)}
.bz-mf-check[data-result="blocked"]{color:var(--bz-danger,#b91c1c)}
.bz-mf-check svg{flex:none;width:14px;height:14px}
.bz-mf-spin{animation:bz-mf-turn 900ms linear infinite}
@keyframes bz-mf-turn{to{transform:rotate(360deg)}}
.bz-mf-skip{position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}
.bz-mf-alert{display:flex;gap:10px;margin:18px 0 0;padding:12px 14px;border:1px solid var(--bz-danger-decor,#ef4444);border-radius:12px;background:#fef2f2;color:var(--bz-danger,#b91c1c);font-size:0.875rem;line-height:1.5}
.bz-mf-alert a{color:inherit;font-weight:600;text-underline-offset:3px}
.bz-mf-alert a:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px;border-radius:2px}
.bz-mf-alert svg{flex:none;width:16px;height:16px;margin-top:2px}
.bz-mf-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin-top:22px}
.bz-mf-submit{display:inline-grid;align-items:center;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:var(--bz-ink,#0a0a0a);color:#ffffff;font:inherit;font-size:0.9375rem;font-weight:600;cursor:pointer;transition:background-color 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1)),transform 150ms var(--bz-ease-out,cubic-bezier(0.23,1,0.32,1))}
.bz-mf-submit>span{display:flex;grid-area:1/1;align-items:center;justify-content:center;gap:8px}
.bz-mf-submit>span[aria-hidden="true"]{visibility:hidden}
@media (hover:hover){.bz-mf-submit:hover{background:#2b2b2e}}
.bz-mf-submit:focus-visible,.bz-mf-secondary:focus-visible{outline:2px solid var(--bz-focus-ring,#912c22);outline-offset:2px}
.bz-mf-submit:active{transform:scale(0.97)}
.bz-mf-submit[aria-disabled="true"]{cursor:progress;background:#3a3a3e}
.bz-mf-submit svg{width:16px;height:16px}
.bz-mf-note{margin:0;font-size:0.8125rem;line-height:1.45;color:var(--bz-ink-subtle,#6b6b70)}
.bz-mf-done{display:flex;flex-direction:column;align-items:flex-start;gap:10px}
.bz-mf-mark{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:#ecfdf5;color:var(--bz-emerald,#047857)}
.bz-mf-mark svg{width:20px;height:20px}
.bz-mf-done-title{margin:4px 0 0;font-size:1.25rem;font-weight:600;letter-spacing:-0.01em;outline:none}
.bz-mf-done-body{margin:0;max-width:30rem;font-size:0.9375rem;line-height:1.55;color:var(--bz-ink-muted,#4a4a4c)}
.bz-mf-secondary{min-height:48px;margin-top:6px;padding:0 18px;border:1px solid var(--bz-ink-disabled,#8a8a8e);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:0.9375rem;font-weight:600;cursor:pointer}
@media (hover:hover){.bz-mf-secondary:hover{background:rgba(10,10,10,0.05)}}
.bz-mf-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
@media (prefers-reduced-motion:reduce){.bz-mf-spin{animation:none}.bz-mf-control,.bz-mf-submit{transition:none}.bz-mf-submit:active{transform:none}}
`;

export type MessageFormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  /** Half width beside another half-width field when the form is wide enough. */
  span?: "half" | "full";
  /** Extra rule. Return a message to show, or null. */
  validate?: (value: string, values: Record<string, string>) => string | null;
  /**
   * Asynchronous check run before sending, only when the field has a value.
   * Resolve `{ ok: false, message }` to stop the send, `{ ok: true, message }`
   * to confirm, or null when the check could not run.
   */
  check?: (value: string, signal: AbortSignal) => Promise<{ ok: boolean; message: string } | null>;
};

export type MessageFormResult = void | { fieldErrors?: Record<string, string>; error?: string };

export type MessageFormProps = {
  /** Send the message. Resolve when it arrived; reject or return `error` when it did not. */
  onSend: (values: Record<string, string>, signal: AbortSignal) => Promise<MessageFormResult>;
  fields?: MessageFormField[];
  defaultValues?: Record<string, string>;
  submitLabel?: string;
  sendingLabel?: string;
  checkingLabel?: string;
  note?: ReactNode;
  successTitle?: ReactNode;
  successBody?: ReactNode | ((values: Record<string, string>) => ReactNode);
  /** Another way to get in touch, offered when sending fails. */
  fallback?: { href: string; label: string };
  timeoutMs?: number;
  checkTimeoutMs?: number;
  /** Name of a hidden field that people leave empty and bots fill in. `false` turns it off. */
  trapName?: string | false;
  className?: string;
};

const DEFAULT_FIELDS: MessageFormField[] = [
  { name: "name", label: "Name", required: true, autoComplete: "name", span: "half", minLength: 2 },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", span: "half" },
  { name: "message", label: "Message", type: "textarea", required: true, minLength: 20, hint: "A few sentences is plenty." },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]{7,20}$/;
const LINK = /^https?:\/\/[^\s/.]+\.[^\s]{2,}/i;

type Status = "idle" | "checking" | "sending" | "sent" | "failed";
type CheckView = { result: "checking" | "ok" | "blocked" | "unavailable"; message: string };

function validateField(field: MessageFormField, value: string, values: Record<string, string>) {
  const trimmed = value.trim();
  if (field.required && !trimmed) return `${field.label} is required.`;
  if (!trimmed) return null;
  if (field.type === "email" && !EMAIL.test(trimmed)) return "Enter an email address like name@example.com.";
  if (field.type === "tel" && !PHONE.test(trimmed)) return "Enter a phone number of 7 to 20 digits.";
  if (field.type === "url" && !LINK.test(trimmed)) return "Enter a link that starts with https://";
  if (field.minLength && trimmed.length < field.minLength) return `Use at least ${field.minLength} characters.`;
  if (field.maxLength && value.length > field.maxLength) return `Use ${field.maxLength} characters or fewer.`;
  return field.validate?.(value, values) ?? null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, controller: AbortController) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const Spinner = () => (
  <svg className="bz-mf-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Alert = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.8 15 14H1L8 1.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 6.2v3.4M8 11.8v.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Tick = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MessageForm({
  onSend,
  fields = DEFAULT_FIELDS,
  defaultValues = {},
  submitLabel = "Send message",
  sendingLabel = "Sending",
  checkingLabel = "Checking",
  note,
  successTitle = "Message sent",
  successBody = "Thanks for writing. You will hear back soon.",
  fallback,
  timeoutMs = 15000,
  checkTimeoutMs = 6000,
  trapName = "leave_this_empty",
  className = "",
}: MessageFormProps) {
  const uid = useId().replace(/:/g, "");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, CheckView>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [sentValues, setSentValues] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const pendingFocus = useRef<string | null>(null);
  const flip = useRef(false);

  const announce = (message: string) => {
    // A trailing zero-width space forces a repeat of the same words to be read again.
    flip.current = !flip.current;
    setAnnouncement(flip.current ? message : `${message}​`);
  };

  useEffect(() => () => controllerRef.current?.abort(), []);

  // Focus after the errors are in the DOM, so the field is read with its message.
  useEffect(() => {
    const name = pendingFocus.current;
    if (!name) return;
    pendingFocus.current = null;
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLElement) el.focus();
  }, [errors]);

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const report = (found: Record<string, string>) => {
    const names = fields.map((f) => f.name).filter((name) => found[name]);
    pendingFocus.current = names[0] ?? null;
    setErrors(found);
    setStatus("idle");
    const labels = names.map((name) => fields.find((f) => f.name === name)?.label ?? name);
    announce(`${names.length} ${names.length === 1 ? "field needs" : "fields need"} attention: ${labels.join(", ")}.`);
  };

  const onFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = event.currentTarget;
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (checks[name]) {
      setChecks((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    const data = new FormData(event.currentTarget);

    if (trapName && String(data.get(trapName) ?? "")) {
      setSentValues({});
      setStatus("sent");
      return;
    }

    const values = Object.fromEntries(fields.map((f) => [f.name, String(data.get(f.name) ?? "")]));
    const found: Record<string, string> = {};
    for (const field of fields) {
      const message = validateField(field, values[field.name], values);
      if (message) found[field.name] = message;
    }
    if (Object.keys(found).length) {
      report(found);
      return;
    }

    busy.current = true;
    setErrors({});
    setFailure(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const toCheck = fields.filter((f) => f.check && values[f.name].trim());
      if (toCheck.length) {
        setStatus("checking");
        announce(`${checkingLabel} your details.`);
        const blocked: Record<string, string> = {};
        await Promise.all(
          toCheck.map(async (field) => {
            setChecks((prev) => ({ ...prev, [field.name]: { result: "checking", message: `${checkingLabel}…` } }));
            const own = new AbortController();
            const relay = () => own.abort();
            controller.signal.addEventListener("abort", relay);
            try {
              const result = await withTimeout(field.check!(values[field.name], own.signal), checkTimeoutMs, own);
              if (controller.signal.aborted) return;
              if (!result) throw new Error("unavailable");
              setChecks((prev) => ({ ...prev, [field.name]: { result: result.ok ? "ok" : "blocked", message: result.message } }));
              if (!result.ok) blocked[field.name] = result.message;
            } catch {
              if (controller.signal.aborted) return;
              setChecks((prev) => ({
                ...prev,
                [field.name]: { result: "unavailable", message: "This could not be checked, so it will be sent as it is." },
              }));
            } finally {
              controller.signal.removeEventListener("abort", relay);
            }
          }),
        );
        if (controller.signal.aborted) return;
        if (Object.keys(blocked).length) {
          report(blocked);
          return;
        }
      }

      setStatus("sending");
      announce(`${sendingLabel} your message.`);
      const result = await withTimeout(onSend(values, controller.signal), timeoutMs, controller);
      if (result && result.fieldErrors && Object.keys(result.fieldErrors).length) {
        report(result.fieldErrors);
        return;
      }
      if (result && result.error) throw new Error(result.error);
      setSentValues(values);
      setStatus("sent");
      announce(typeof successTitle === "string" ? successTitle : "Message sent.");
    } catch (error) {
      const message =
        error instanceof Error && error.message === "timeout"
          ? "Sending took too long, so it was stopped. Nothing you typed was lost."
          : error instanceof Error && error.message
            ? error.message
            : "The message could not be sent.";
      setFailure(message);
      setStatus("failed");
      announce(`Not sent. ${message}`);
    } finally {
      busy.current = false;
    }
  };

  const reset = () => {
    setErrors({});
    setChecks({});
    setFailure(null);
    setStatus("idle");
    setFormKey((k) => k + 1);
    announce("Form cleared.");
  };

  const working = status === "checking" || status === "sending";
  const liveRegion = (
    <p className="bz-mf-sr" aria-live="polite">
      {announcement}
    </p>
  );

  if (status === "sent") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className={`bz-mf ${className}`.trim()}>
          <div className="bz-mf-done">
            <span className="bz-mf-mark" aria-hidden="true">
              <Tick />
            </span>
            <h3 ref={doneRef} tabIndex={-1} className="bz-mf-done-title">
              {successTitle}
            </h3>
            <p className="bz-mf-done-body">{typeof successBody === "function" ? successBody(sentValues) : successBody}</p>
            <button type="button" className="bz-mf-secondary" onClick={reset}>
              Write another
            </button>
          </div>
          {liveRegion}
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form key={formKey} ref={formRef} className={`bz-mf ${className}`.trim()} noValidate onSubmit={onSubmit} aria-busy={working || undefined}>
        <div className="bz-mf-grid">
          {fields.map((field) => {
            const id = `${uid}-${field.name}`;
            const error = errors[field.name];
            const check = checks[field.name];
            const describedBy = [field.hint ? `${id}-hint` : null, error ? `${id}-error` : null, field.check ? `${id}-check` : null]
              .filter(Boolean)
              .join(" ");
            const common = {
              id,
              name: field.name,
              className: "bz-mf-control",
              placeholder: field.placeholder,
              autoComplete: field.autoComplete,
              defaultValue: defaultValues[field.name],
              "aria-invalid": error ? true : undefined,
              "aria-required": field.required || undefined,
              "aria-describedby": describedBy || undefined,
              onChange: onFieldChange,
            };
            return (
              <div key={field.name} className="bz-mf-field" data-span={field.span ?? "full"}>
                <label htmlFor={id} className="bz-mf-label">
                  {field.label}
                  {field.required ? (
                    <span className="bz-mf-req" aria-hidden="true">
                      *
                    </span>
                  ) : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea {...common} rows={5} />
                ) : (
                  <input {...common} type={field.type ?? "text"} inputMode={field.type === "url" ? "url" : undefined} />
                )}
                {field.hint ? (
                  <p id={`${id}-hint`} className="bz-mf-hint">
                    {field.hint}
                  </p>
                ) : null}
                {error ? (
                  <p id={`${id}-error`} className="bz-mf-error">
                    <Alert />
                    {error}
                  </p>
                ) : null}
                {field.check ? (
                  <p id={`${id}-check`} className="bz-mf-check" role="status" data-result={check?.result}>
                    {check ? (
                      <>
                        {check.result === "checking" ? <Spinner /> : check.result === "ok" ? <Tick /> : check.result === "blocked" ? <Alert /> : null}
                        {check.message}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {trapName ? (
          <div className="bz-mf-skip" aria-hidden="true">
            <label htmlFor={`${uid}-skip`}>Leave this field empty</label>
            <input id={`${uid}-skip`} name={trapName} tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
        ) : null}

        {status === "failed" && failure ? (
          <div className="bz-mf-alert" role="alert">
            <Alert />
            <p style={{ margin: 0 }}>
              {failure}
              {fallback ? (
                <>
                  {" "}
                  <a href={fallback.href}>{fallback.label}</a>
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        <div className="bz-mf-actions">
          <button type="submit" className="bz-mf-submit" aria-disabled={working || undefined}>
            <span aria-hidden={working || undefined}>{submitLabel}</span>
            <span aria-hidden={working ? undefined : true}>
              <Spinner />
              {status === "checking" ? checkingLabel : sendingLabel}
            </span>
          </button>
          {note ? <p className="bz-mf-note">{note}</p> : null}
        </div>
        {liveRegion}
      </form>
    </>
  );
}
