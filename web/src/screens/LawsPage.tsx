import { RULES } from "../lib/rules.ts";
import { commonLand } from "../lib/derive.ts";
import { useWorld } from "../world-context.tsx";
import { Icon } from "../components/Icons.tsx";
import { ErrorState, SectionHeader, Skeleton } from "../components/kit.tsx";

export function LawsPage() {
  const { snapshot, error, loading, reload } = useWorld();
  const w = snapshot?.world ?? null;

  return (
    <div className="page">
      <SectionHeader as="h1" title="Laws" eyebrow="The only law is the charter" />
      {error && !snapshot ? <ErrorState message={error} onRetry={reload} /> : loading && !snapshot ? <div className="panel panel-paper"><Skeleton lines={6} /></div> : null}

      {w ? (
        <div className="cols">
          <section className="panel panel-paper charter" aria-labelledby="charter-title">
            <SectionHeader as="h2" title="The charter" eyebrow="Written in English, read from the contract" />
            <p id="charter-title" className="panel-note">The validators are told to refuse anything the charter does not clearly permit, and that nothing a citizen writes can change it.</p>
            <blockquote className="charter-text">{w.charter}</blockquote>
          </section>

          <div className="stack">
            <section className="panel panel-dark">
              <SectionHeader as="h2" title="Judged by the jury" />
              <p className="help-light">The validators decide what an action would physically do under the charter, the day's weather and the land left. This is judgement: it can refuse, and validators can occasionally fail to agree, in which case nothing changes.</p>
            </section>

            <section className="panel panel-dark">
              <SectionHeader as="h2" title="Enforced by code" eyebrow="Whatever the jury says" />
              <ul className="rules">
                <li><Icon name="shield" size={17} /> A gain is capped at {RULES.maxGainPerAction} of any resource per action, and a holding can never go below zero.</li>
                <li><Icon name="shield" size={17} /> Wood, stone and grain come from the shared common land. A gain beyond what is left is clipped; with nothing left the action is refused.</li>
                <li><Icon name="shield" size={17} /> Every citizen pays {RULES.upkeepGrain} grain at the end of each epoch. {RULES.starveAfterEpochs} hungry epochs in a row mean starvation and a forfeited bond.</li>
                <li><Icon name="shield" size={17} /> A farm costs {RULES.farmCost.wood} wood and {RULES.farmCost.stone} stone, up to {RULES.maxFarms} per citizen, and counts {RULES.farmScore} towards the score.</li>
                <li><Icon name="shield" size={17} /> Trades are two-party offers settled by code. A batch is at most {RULES.maxActionsPerBatch} actions of {RULES.maxActionChars} characters, once per epoch.</li>
                <li><Icon name="shield" size={17} /> At the season's end survivors share the pool in proportion to their score.</li>
              </ul>
            </section>

            <section className="panel panel-paper">
              <SectionHeader as="h2" title="Today's conditions" />
              <dl className="kv">
                <dt>Season</dt><dd className="cap">{w.conditions.season}</dd>
                <dt>Event</dt><dd className="cap">{w.conditions.event}</dd>
                <dt>Common land per citizen</dt><dd className="mono">{Object.entries(w.commonsPerCitizen).map(([k, v]) => `${k} ${v}`).join(" · ")}</dd>
                <dt>Left this epoch</dt><dd className="mono">{commonLand(w).map((l) => `${l.resource} ${l.left}/${l.capacity}`).join(" · ")}</dd>
              </dl>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
