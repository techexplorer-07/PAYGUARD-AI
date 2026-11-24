import type { ReactNode } from 'react';
import type { DecimalValue, PaymentProtectionResponse } from '../../types/paymentProtection';
import { formatDateTime, formatMoney } from '../../utils/format';
import { describeIndicator, parseIndicator } from '../../utils/assessment/indicators';
import { engineRiskView } from '../../utils/assessment/verdict';
import { interventionLabel, scoreLabel } from '../../utils/investigator/records';
import { EngineRiskBadge } from '../customer/assessment/AssessmentBadges';
import { Panel, PanelHeader } from './InvestigatorPrimitives';

const SCORE_NOTE = 'Heuristic severity on a 0–1 scale; not a calibrated probability of fraud.';

export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-ink-muted">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bullets({ items, empty }: { items: string[]; empty?: string }) {
  if (items.length === 0) return empty ? <p className="text-sm text-ink-muted">{empty}</p> : null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-ink">
      {items.map((item) => (
        <li key={item} className="break-words">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</h3>;
}

function IndicatorList({ codes }: { codes: string[] }) {
  if (codes.length === 0) return <p className="text-sm text-ink-muted">None returned.</p>;
  return (
    <ul className="space-y-1.5">
      {codes.map((code) => {
        const parsed = parseIndicator(code);
        const description = describeIndicator(parsed);
        return (
          <li key={code} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium text-ink">{description.title}</span>
            <code className="break-all font-mono text-xs text-ink-muted">{code}</code>
          </li>
        );
      })}
    </ul>
  );
}

function NotEvaluated({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-ink-muted">{children}</p>;
}

function contributionRows(contributions: Record<string, DecimalValue>) {
  return Object.entries(contributions).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    value: typeof value === 'number' ? value.toFixed(2) : Number(value).toFixed(2),
  }));
}

function ContributionTable({ rows, caption }: { rows: { label: string; value: string }[]; caption: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-muted">No contributions returned.</p>;
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <tbody className="divide-y divide-line">
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="py-1.5 pr-4 text-left font-normal text-ink-muted">{row.label}</th>
            <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IntentPanel({ response }: { response: PaymentProtectionResponse }) {
  const intent = response.intent_assessment;
  return (
    <Panel aria-labelledby="panel-intent">
      <PanelHeader
        id="panel-intent"
        title="Intent intelligence"
        actions={intent && <EngineRiskBadge risk={engineRiskView(intent.risk_assessment.risk_level)} />}
      />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {!intent ? (
          <NotEvaluated>Not evaluated: no customer message was submitted with this assessment.</NotEvaluated>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Extracted amount', value: intent.extracted_intent.amount !== null ? `${formatMoney(intent.extracted_intent.amount, intent.extracted_intent.currency ?? 'INR')} (${intent.extracted_intent.amount_status})` : `Not found (${intent.extracted_intent.amount_status})` },
                { label: 'Extracted currency', value: intent.extracted_intent.currency ?? 'Not found' },
                { label: 'Extracted recipient', value: intent.extracted_intent.recipient_id ? `${intent.extracted_intent.recipient_id} (${intent.extracted_intent.recipient_status})` : `Not found (${intent.extracted_intent.recipient_status})` },
                { label: 'Amount comparison', value: intent.comparison.amount_status },
                { label: 'Recipient comparison', value: intent.comparison.recipient_status },
                { label: 'Currency comparison', value: intent.comparison.currency_status },
                { label: 'Urgency indicators', value: intent.extracted_intent.urgency_detected ? 'Detected' : 'Not detected' },
                { label: 'Threat indicators', value: intent.extracted_intent.threat_detected ? 'Detected' : 'Not detected' },
                { label: 'Intent heuristic score', value: <span title={SCORE_NOTE}>{scoreLabel(intent.risk_assessment.heuristic_score)}</span> },
              ]}
            />
            {intent.extracted_intent.evidence_snippets.length > 0 && (
              <div className="space-y-1.5">
                <Subheading>Extracted message snippets</Subheading>
                <ul className="flex flex-wrap gap-1.5">
                  {intent.extracted_intent.evidence_snippets.map((snippet, index) => (
                    <li key={`${snippet.field}-${index}`} className="rounded-md bg-muted px-2 py-1 text-xs text-ink">
                      <span className="font-medium text-ink-muted">{snippet.field}:</span> “{snippet.text_snippet}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-1.5">
              <Subheading>Comparison summary</Subheading>
              <p className="break-words text-sm leading-6 text-ink">{intent.comparison.summary}</p>
            </div>
            <div className="space-y-1.5">
              <Subheading>Intent engine reasons</Subheading>
              <Bullets items={intent.risk_assessment.reasons} />
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

export function BehaviouralPanel({ response }: { response: PaymentProtectionResponse }) {
  const behavioural = response.behavioural_assessment;
  return (
    <Panel aria-labelledby="panel-behaviour">
      <PanelHeader
        id="panel-behaviour"
        title="Behavioural intelligence"
        actions={behavioural && <EngineRiskBadge risk={engineRiskView(behavioural.risk_level)} />}
      />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {!behavioural ? (
          <NotEvaluated>Not evaluated: no customer payment history was supplied with this assessment. Absence of history is not a risk signal.</NotEvaluated>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Anomaly score', value: <span title={SCORE_NOTE}>{scoreLabel(behavioural.anomaly_score)}</span> },
                { label: 'Data sufficiency', value: behavioural.data_sufficiency },
                { label: 'Assessment', value: <span className="break-all font-mono text-xs">{behavioural.assessment_id}</span> },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Subheading>Signal contributions</Subheading>
                <ContributionTable rows={contributionRows(behavioural.feature_contributions)} caption="Behavioural signal contributions" />
              </div>
              <div className="space-y-1.5">
                <Subheading>Indicators</Subheading>
                <IndicatorList codes={behavioural.detected_indicators} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Subheading>Baseline, deviation, velocity, method and time notes</Subheading>
              <Bullets items={behavioural.explanation} />
              <p className="text-xs leading-5 text-ink-muted">
                The payment-protection response includes these explanation notes and contributions, not the raw baseline
                feature values. A new beneficiary on its own is not treated as fraud.
              </p>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

export function RecipientPanel({ response, actions }: { response: PaymentProtectionResponse; actions?: ReactNode }) {
  const recipient = response.recipient_assessment;
  return (
    <Panel aria-labelledby="panel-recipient">
      <PanelHeader
        id="panel-recipient"
        title="Recipient intelligence"
        actions={recipient ? <EngineRiskBadge risk={engineRiskView(recipient.risk_level)} /> : undefined}
      />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        {!recipient ? (
          <NotEvaluated>Not evaluated: the recipient was not found in an evidence graph available to the backend for this assessment.</NotEvaluated>
        ) : (
          <>
            <Facts
              items={[
                { label: 'Recipient risk score', value: <span title={SCORE_NOTE}>{scoreLabel(recipient.recipient_risk_score)}</span> },
                { label: 'Data sufficiency', value: recipient.data_sufficiency },
                { label: 'Recipient engine recommendation', value: recipient.recommended_action },
                { label: 'Evidence graph', value: <span className="break-all font-mono text-xs">{recipient.graph_id}</span> },
                { label: 'Evidence items cited', value: recipient.supporting_evidence.length },
              ]}
            />
            <div className="space-y-1.5">
              <Subheading>Indicators</Subheading>
              <IndicatorList codes={recipient.detected_indicators} />
            </div>
            <div className="space-y-1.5">
              <Subheading>Recipient engine explanation</Subheading>
              <p className="break-words text-sm leading-6 text-ink">{recipient.explanation}</p>
            </div>
            <div className="space-y-1.5">
              <Subheading>Limitations</Subheading>
              <Bullets items={recipient.assessment_limitations} />
            </div>
          </>
        )}
        {actions}
      </div>
    </Panel>
  );
}

const engineNames: Record<string, string> = {
  intent_correlation: 'Intent correlation',
  behavioural_risk: 'Behavioural anomaly',
  recipient_intelligence: 'Recipient intelligence',
};

export function UnifiedPanel({ response }: { response: PaymentProtectionResponse }) {
  const unified = response.unified_risk_assessment;
  const policy = unified.detected_indicators.filter((code) => describeIndicator(parseIndicator(code)).policy);
  const signals = unified.detected_indicators.filter((code) => !policy.includes(code));
  return (
    <Panel aria-labelledby="panel-unified">
      <PanelHeader id="panel-unified" title="Unified risk assessment" description={SCORE_NOTE} />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <Facts
          items={[
            { label: 'Composite score', value: scoreLabel(unified.overall_risk_score) },
            { label: 'Risk level', value: unified.risk_level },
            { label: 'Data sufficiency', value: unified.data_sufficiency },
            { label: 'Recommendation', value: interventionLabel(unified.recommended_action) },
            { label: 'Policy version', value: <span className="break-all font-mono text-xs">{unified.policy_version}</span> },
            { label: 'Model', value: <span className="break-all font-mono text-xs">{unified.model_type}</span> },
          ]}
        />
        <div className="space-y-1.5">
          <Subheading>Engine status</Subheading>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">Status of each engine</caption>
              <thead className="text-xs text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-1.5 pr-3 text-left font-medium">Engine</th>
                  <th scope="col" className="py-1.5 pr-3 text-left font-medium">Status</th>
                  <th scope="col" className="py-1.5 pr-3 text-left font-medium">Risk level</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {Object.entries(unified.engine_signal_summary).map(([key, summary]) => {
                  const contributionKey = key === 'intent_correlation' ? 'intent' : key === 'behavioural_risk' ? 'behavioural' : 'recipient';
                  const contribution = unified.feature_contributions[contributionKey];
                  return (
                    <tr key={key}>
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-ink">{engineNames[key] ?? key}</th>
                      <td className="py-1.5 pr-3 text-ink-muted">{summary.status ?? '—'}</td>
                      <td className="py-1.5 pr-3 text-ink-muted">{summary.risk_level ?? '—'}</td>
                      <td className="py-1.5 text-right font-mono text-xs tabular-nums text-ink">
                        {typeof contribution === 'number' ? contribution.toFixed(3) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Subheading>Risk indicators</Subheading>
            <IndicatorList codes={signals} />
          </div>
          <div className="space-y-1.5">
            <Subheading>Policy overrides and safeguards</Subheading>
            <IndicatorList codes={policy} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Subheading>Missing evidence</Subheading>
            <Bullets items={unified.missing_evidence} empty="None reported." />
          </div>
          <div className="space-y-1.5">
            <Subheading>Conflicting signals</Subheading>
            <Bullets items={unified.conflicting_signals} empty="None reported." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Subheading>Audit narrative</Subheading>
          <p className="break-words text-sm leading-6 text-ink">{unified.explanation}</p>
        </div>
      </div>
    </Panel>
  );
}

export function PaymentProtectionPanel({ response }: { response: PaymentProtectionResponse }) {
  const intervention = response.intervention_recommendation;
  return (
    <Panel aria-labelledby="panel-protection">
      <PanelHeader
        id="panel-protection"
        title="Payment protection recommendation"
        description="Advisory output of the Payment Protection Orchestrator. PAYGUARD did not block, pause or authorise any payment."
      />
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <Facts
          items={[
            { label: 'Recommended action', value: interventionLabel(intervention.action) },
            { label: 'Recommendation level', value: intervention.severity },
            { label: 'Intervention category', value: intervention.intervention_type },
            { label: 'Simulated action code', value: <span className="font-mono text-xs">{intervention.simulated_action_code}</span> },
            { label: 'Simulated', value: intervention.simulated_intervention_active ? 'Yes, simulation only' : 'Not flagged as simulated' },
            { label: 'Assessed', value: formatDateTime(response.timestamp) },
          ]}
        />
        <div className="space-y-1.5">
          <Subheading>Customer guidance issued</Subheading>
          <p className="break-words rounded-lg bg-muted px-3.5 py-2.5 text-sm leading-6 text-ink">{intervention.user_guidance_message}</p>
        </div>
        <div className="space-y-1.5">
          <Subheading>Rationale</Subheading>
          <Bullets items={intervention.rationale} empty="No rationale returned." />
        </div>
        <p className="text-xs leading-5 text-ink-muted">{intervention.disclaimer}</p>
      </div>
    </Panel>
  );
}
