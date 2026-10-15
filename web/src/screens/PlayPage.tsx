import { useMemo, useState } from "react";
import { sendTx } from "../lib/chain.ts";
import { formatGen } from "../lib/format.ts";
import { RULES } from "../lib/rules.ts";
import { activityOf } from "../lib/derive.ts";
import { useTx } from "../hooks.ts";
import { useSession } from "../wallet-context.ts";
import { useWorld } from "../world-context.tsx";
import { WorldScene } from "../components/WorldScene.tsx";
import { Icon } from "../components/Icons.tsx";
import { ActionLifecycle, EmptyState, ErrorState, SectionHeader, Skeleton, StatusBadge, TxLink, TxStatus } from "../components/kit.tsx";
import { EventRow } from "../components/events.tsx";

const EXAMPLE = "Gather 5 grain from the common land.\nGather 4 wood at the forest edge.";

export function PlayPage() {
  const { signer, me, connectWallet, useDemoAccount } = useSession();
  const { snapshot, error, reload } = useWorld();
  const join = useTx();
  const act = useTx();
  const farm = useTx();
  const [joinHash, setJoinHash] = useState<string>();
  const [actHash, setActHash] = useState<string>();
  const [farmHash, setFarmHash] = useState<string>();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmFarm, setConfirmFarm] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const w = snapshot?.world ?? null;
  const citizen = snapshot?.citizens.find((c) => c.address === me) ?? null;
  const lines = useMemo(() => draft.split("\n").map((l) => l.trim()).filter(Boolean), [draft]);
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);

  let problem: string | null = null;
  if (lines.length === 0) problem = "Describe at least one action.";
  else if (lines.length > RULES.maxActionsPerBatch) problem = `At most ${RULES.maxActionsPerBatch} actions per epoch; you wrote ${lines.length}. Put one action on each line.`;
  else if (lines.some((l) => l.length < 3)) problem = "Each action needs at least 3 characters.";
  else if (longest > RULES.maxActionChars) problem = `Each action can be at most ${RULES.maxActionChars} characters; the longest is ${longest}.`;

  const closed = !w || w.status !== "RUNNING";
  const blocked = !signer || !citizen || !citizen.alive || closed;

  async function submit() {
    setTouched(true);
    if (problem || blocked || !signer) return;
    setSent(lines.length);
    const out = await act.run((p) => sendTx(signer, "act", [lines], 0n, p, setActHash));
    if (out && !out.error) reload(); // the draft is kept until the result is read back, so a failure never loses it
  }
  async function doJoin() {
    if (!signer || !w) return;
    const out = await join.run((p) => sendTx(signer, "register", [name.trim()], w.bond, p, setJoinHash));
    if (out && !out.error) reload();
  }
  async function doFarm() {
    if (!signer) return;
    setConfirmFarm(false);
    const out = await farm.run((p) => sendTx(signer, "build_farm", [], 0n, p, setFarmHash));
    if (out && !out.error) reload();
  }

  const mine = citizen && snapshot ? activityOf(snapshot.chronicle, citizen.name).filter((e) => e.kind === "action").reverse() : [];
  const latest = act.state.kind === "done" && !act.state.outcome.error && sent ? mine.slice(0, sent) : [];

  return (
    <div className="page">
      <section className="band" aria-labelledby="play-title">
        {w ? <WorldScene className="band-art" season={w.conditions.season} event={w.conditions.event} label="" /> : null}
        <div className="band-shade" aria-hidden="true" />
        <div className="band-inner">
          <p className="eyebrow eyebrow-light">Play</p>
          <h1 id="play-title" className="display display-md">Your actions shape the world.</h1>
          <p className="hero-sub">Describe what your citizen does, in plain English. A jury of validators judges it against the charter and today's weather; the contract enforces the limits.</p>
        </div>
      </section>

      {error && !snapshot ? <ErrorState message={error} onRetry={reload} /> : null}
      {!snapshot && !error ? <div className="panel panel-paper"><Skeleton lines={4} /></div> : null}

      {w ? (
        <div className="cols cols-play">
          <div className="stack">
            {!signer ? (
              <section className="panel panel-paper">
                <SectionHeader title="Sign in to play" eyebrow="Step one" />
                <p>Connect a wallet to act as a citizen, or use a throwaway demo account for the test network.</p>
                <div className="row"><button className="btn btn-primary" onClick={() => void connectWallet()}>Connect wallet</button><button className="btn btn-quiet" onClick={useDemoAccount}>Use demo account</button></div>
              </section>
            ) : null}

            {signer && !citizen && !closed ? (
              <section className="panel panel-paper" aria-labelledby="join-title">
                <SectionHeader title="Join the commonwealth" eyebrow="Step two" />
                <p id="join-title">Joining posts a bond of <b>{formatGen(w.bond)} GEN</b>. If you starve you forfeit it; at season's end the survivors share the pool by score.</p>
                <label className="field" htmlFor="citizen-name"><span>Your citizen's name</span></label>
                <input id="citizen-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada" aria-describedby="name-help" />
                <p id="name-help" className="help">1 to 40 characters. It appears in the chronicle.</p>
                <button className="btn btn-primary" disabled={join.busy || name.trim().length === 0} onClick={doJoin}>{join.busy ? "Joining…" : "Post the bond and join"}</button>
                <TxStatus state={join.state} hash={joinHash} doneText={() => "You are a citizen."} />
              </section>
            ) : null}

            {closed ? (
              <div className="notice notice-warn" role="status"><Icon name="clock" size={16} /> The season is over, so nothing more can be done in this world. You can still read the results on the <a href="#/">World</a> page.</div>
            ) : null}

            <section className="panel panel-paper composer" aria-labelledby="composer-title">
              <SectionHeader as="h2" title="Propose an action" eyebrow="Once per epoch" />
              <p id="composer-title" className="panel-note">Write one action per line (up to {RULES.maxActionsPerBatch}). Anything the charter does not clearly permit is refused, and so is anything that depends on another citizen.</p>
              <label className="field" htmlFor="draft"><span>What does your citizen do?</span></label>
              <textarea
                id="draft"
                className={`input textarea ${touched && problem ? "input-bad" : ""}`}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setTouched(true); }}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void submit(); }}
                placeholder={EXAMPLE}
                rows={6}
                aria-invalid={touched && problem ? true : undefined}
                aria-describedby="draft-help draft-error"
                disabled={act.busy}
              />
              <div className="composer-meta">
                <span id="draft-help" className="help">{lines.length} of {RULES.maxActionsPerBatch} actions · longest {longest} of {RULES.maxActionChars} characters · Ctrl+Enter to submit</span>
                <button className="btn btn-primary" onClick={submit} disabled={act.busy || blocked} aria-describedby="why-disabled">
                  {act.busy ? "Judging…" : "Submit to the jury"} <Icon name="arrow" size={16} />
                </button>
              </div>
              <p id="draft-error" className="field-error" role="alert">{touched && problem ? problem : ""}</p>
              <p id="why-disabled" className="help">
                {!signer ? "Sign in first." : !citizen ? "Join the commonwealth to act." : !citizen.alive ? "This citizen has starved and can no longer act." : closed ? "The season is over." : ""}
              </p>
              <ActionLifecycle state={act.state} />
              <TxStatus state={act.state} hash={actHash} doneText={() => "The jury has ruled and the contract has recorded it."} />
              {latest.length > 0 ? (
                <div className="results" aria-live="polite">
                  <h3 className="mini-title">What the world decided</h3>
                  <ul className="events">{[...latest].reverse().map((e, i) => <EventRow key={i} e={e} showWho={false} />)}</ul>
                </div>
              ) : null}
            </section>

            <section className="panel panel-paper" aria-labelledby="recent-title">
              <SectionHeader title="Your recent actions" eyebrow="Confirmed on chain" />
              <p id="recent-title" className="panel-note">Read from the chronicle, which keeps the most recent 60 entries across all citizens.</p>
              {!citizen ? (
                <EmptyState icon="user" title="No citizen yet">{signer ? "Join to see your actions here." : "Sign in to see your actions here."}</EmptyState>
              ) : mine.length === 0 ? (
                <EmptyState icon="scroll" title="No recorded actions">Your judged actions will appear here once the jury has ruled.</EmptyState>
              ) : (
                <ul className="events">{mine.slice(0, 8).map((e, i) => <EventRow key={i} e={e} showWho={false} />)}</ul>
              )}
            </section>
          </div>

          <aside className="stack" aria-label="Guidance and shortcuts">
            <section className="panel panel-dark">
              <SectionHeader title="How it works" as="h2" />
              <ol className="steps">
                <li><span className="step-n">1</span><div><b>You propose</b><p>Write what you intend in plain English.</p></div></li>
                <li><span className="step-n">2</span><div><b>The jury evaluates</b><p>Validators judge what the action would physically do under the charter, the weather and the land left. This is judgement, and it can refuse.</p></div></li>
                <li><span className="step-n">3</span><div><b>The contract enforces</b><p>Plain code caps gains at {RULES.maxGainPerAction}, never lets a holding go below zero, draws on the shared common land, and handles trades, farms, hunger and the payout. The jury never moves money.</p></div></li>
              </ol>
              <p className="help-light"><Icon name="shield" size={15} /> A proposal is not a guarantee: the jury can refuse it, and a refused action changes nothing.</p>
            </section>

            <section className="panel panel-dark">
              <SectionHeader title="Quick actions" as="h2" />
              <div className="quick">
                {!confirmFarm ? (
                  <button className="quick-btn" disabled={!citizen || !citizen.alive || closed || farm.busy} onClick={() => setConfirmFarm(true)}>
                    <Icon name="farm" size={18} /> Build a farm <small>{RULES.farmCost.wood} wood + {RULES.farmCost.stone} stone</small>
                  </button>
                ) : (
                  <div className="confirm" role="alertdialog" aria-label="Confirm building a farm">
                    <p>Spend {RULES.farmCost.wood} wood and {RULES.farmCost.stone} stone to build a farm? You can own at most {RULES.maxFarms}.</p>
                    <div className="row"><button className="btn btn-primary btn-sm" onClick={doFarm}>Build it</button><button className="btn btn-quiet btn-sm" onClick={() => setConfirmFarm(false)}>Cancel</button></div>
                  </div>
                )}
                <a className="quick-btn" href="#/market"><Icon name="trade" size={18} /> Create a trade offer <small>Trades are plain code</small></a>
                <a className="quick-btn" href={citizen ? `#/citizen/${citizen.address}` : "#/citizens"}><Icon name="user" size={18} /> Check resources <small>{citizen ? "Your profile" : "Browse citizens"}</small></a>
              </div>
              <TxStatus state={farm.state} hash={farmHash} doneText={() => "Farm built."} />
            </section>

            {citizen ? (
              <section className="panel panel-dark">
                <SectionHeader title="Your citizen" as="h2" />
                <dl className="kv">
                  <dt>Name</dt><dd>{citizen.name}</dd>
                  <dt>Status</dt><dd>{citizen.alive ? <StatusBadge tone="ok">Alive</StatusBadge> : <StatusBadge tone="bad" icon="skull">Starved in epoch {citizen.diedEpoch}</StatusBadge>}</dd>
                  <dt>Holdings</dt><dd className="mono">wood {citizen.wood} · stone {citizen.stone} · grain {citizen.grain} · farms {citizen.farms}</dd>
                  <dt>Hunger</dt><dd>{citizen.hunger === 0 ? "Fed" : `${citizen.hunger} hungry epoch${citizen.hunger > 1 ? "s" : ""} in a row`}</dd>
                </dl>
                <p className="help-light">The world takes {RULES.upkeepGrain} grain from every citizen at the end of each epoch; {RULES.starveAfterEpochs} hungry epochs in a row mean starvation.</p>
                {actHash ? <p className="help-light">Last proposal: <TxLink hash={actHash} /></p> : null}
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
