import { useOracleStore, type Tab } from '../../state/store';

const tabs: Tab[] = ['wizard', 'manager', 'live', 'frames', 'presets'];

export function Tabs() {
  const tab = useOracleStore((s) => s.tab);
  const setTab = useOracleStore((s) => s.setTab);

  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t} className={t === tab ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
