'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface UO {
  uo_cod: string; uo_nome: string; n_programacoes: number;
  empenhado_2026: number; media_mensal: number; projecao_2026: number;
  saldo_total: number; deficit_2026: number; situacao: string;
  autorizado_2026: number; liquidado_2025: number; deficit_2025: number;
  projecao_alt: number; media_deficit: number;
}
interface Prog {
  uo_cod: string; uo_nome: string; pt_cod: string; pt_desc: string;
  iduso: number; fonte: string; nd: number; gnd: string;
  empenhado: number; media_mensal: number; projecao_2026: number;
  disponivel: number; cota: number; contingencia: number; saldo_total: number;
  deficit_2026: number; autorizado_2026: number; liquidado_2025: number;
  deficit_2025: number; projecao_alt: number; media_deficit: number;
}
interface DashData { por_uo: UO[]; por_prog: Prog[]; }

// ── Formatters ────────────────────────────────────────────────────────────────
const Rm = (n: number) => `R$ ${(n / 1e6).toFixed(1)}M`;
const Rb = (n: number) => `R$ ${(n / 1e9).toFixed(2)}B`;
const abrev = (s: string, max = 30) => s.length > max ? s.slice(0, max) + '…' : s;

// ── Colours ───────────────────────────────────────────────────────────────────
const BLUE = '#2563eb'; const RED = '#dc2626'; const GREEN = '#16a34a';
const ORANGE = '#ea580c'; const GREY = '#6b7280';
const PIE_COLORS = ['#dc2626', '#16a34a', '#2563eb', '#d97706'];
const PG = 10;

// ── Sub-components ────────────────────────────────────────────────────────────
function KPI({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', borderLeft: `4px solid ${warn ? RED : BLUE}` }}>
      <div style={{ fontSize: 11, color: GREY, textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: warn ? RED : '#111' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: GREY, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <b>{Rm((p.value as number) * 1e6)}</b></div>
      ))}
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? GREEN : RED }}>
      {ok ? 'OK' : 'DEFICITÁRIA'}
    </span>
  );
}

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (n: number) => void }) {
  const last = Math.ceil(total / PG) - 1;
  if (total <= PG) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12, fontSize: 12, color: GREY, alignItems: 'center' }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 0} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 5, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? .4 : 1 }}>‹</button>
      <span>Pág. {page + 1} / {last + 1}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= last} style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 5, cursor: page >= last ? 'not-allowed' : 'pointer', opacity: page >= last ? .4 : 1 }}>›</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [filterUO, setFilterUO] = useState('');
  const [filterSit, setFilterSit] = useState('');
  const [busca, setBusca] = useState('');
  const [uoPage, setUoPage] = useState(0);
  const [progPage, setProgPage] = useState(0);

  useEffect(() => { fetch('/data.json').then(r => r.json()).then(setData); }, []);

  const filtUO = useMemo(() => {
    if (!data) return [];
    return data.por_uo.filter(r =>
      (!filterUO || r.uo_cod === filterUO) &&
      (!filterSit || r.situacao === filterSit)
    );
  }, [data, filterUO, filterSit]);

  const filtProg = useMemo(() => {
    if (!data) return [];
    const q = busca.toLowerCase();
    return data.por_prog.filter(r =>
      (!filterUO || r.uo_cod === filterUO) &&
      (!q || r.pt_cod.includes(q) || r.pt_desc.toLowerCase().includes(q) || r.uo_nome.toLowerCase().includes(q))
    );
  }, [data, filterUO, busca]);

  const kpi = useMemo(() => ({
    emp: filtUO.reduce((s, r) => s + r.empenhado_2026, 0),
    def26: filtUO.reduce((s, r) => s + (r.deficit_2026 < 0 ? r.deficit_2026 : 0), 0),
    def25: filtUO.reduce((s, r) => s + (r.deficit_2025 < 0 ? r.deficit_2025 : 0), 0),
    nDef: filtUO.filter(r => r.situacao === 'DEFICITÁRIA').length,
    n: filtUO.length,
  }), [filtUO]);

  const top10 = useMemo(() =>
    [...filtUO].sort((a, b) => a.deficit_2026 - b.deficit_2026).slice(0, 10).map(r => ({
      name: abrev(r.uo_nome.split(' ').slice(-2).join(' '), 20),
      deficit: -r.deficit_2026 / 1e6,
      projecao: r.projecao_2026 / 1e6,
    })), [filtUO]);

  const comparChart = useMemo(() =>
    [...filtUO].sort((a, b) => b.empenhado_2026 - a.empenhado_2026).slice(0, 8).map(r => ({
      name: abrev(r.uo_nome.split(' ').slice(-1)[0], 10),
      'Autorizado': r.autorizado_2026 / 1e6,
      'Projeção 2026': r.projecao_2026 / 1e6,
      'Liquidado 2025': r.liquidado_2025 / 1e6,
    })), [filtUO]);

  const sitPie = useMemo(() => {
    const d = filtUO.filter(r => r.situacao === 'DEFICITÁRIA').length;
    return [{ name: 'Deficitária', value: d }, { name: 'OK', value: filtUO.length - d }];
  }, [filtUO]);

  const gndPie = useMemo(() => {
    const m: Record<string, number> = {};
    filtProg.filter(r => r.deficit_2026 < 0).forEach(r => {
      const k = `GND ${r.gnd}`; m[k] = (m[k] || 0) - r.deficit_2026;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: value / 1e6 })).sort((a, b) => b.value - a.value);
  }, [filtProg]);

  const uoOpts = useMemo(() => data ? [...new Map(data.por_uo.map(r => [r.uo_cod, r.uo_nome])).entries()] : [], [data]);

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: GREY }}>
      Carregando dados…
    </div>
  );

  const resetPage = () => { setUoPage(0); setProgPage(0); };
  const card = { background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' };
  const thStyle = { textAlign: 'left' as const, padding: '8px 10px', color: GREY, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const };
  const tdStyle = { padding: '8px 10px' };

  return (
    <div style={{ background: '#f4f6f9', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#142850', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Painel de Déficit Orçamentário</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>CODIM / SUOP / SEFIN — Projeção 2026 vs Liquidado 2025</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
          {[
            { label: 'UO', node: <select value={filterUO} onChange={e => { setFilterUO(e.target.value); resetPage(); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 13, minWidth: 180 }}>
              <option value="">Todas as UOs</option>
              {uoOpts.map(([cod, nome]) => <option key={cod} value={cod}>{abrev(nome, 40)}</option>)}
            </select> },
            { label: 'Situação', node: <select value={filterSit} onChange={e => { setFilterSit(e.target.value); resetPage(); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 13 }}>
              <option value="">Todas</option><option value="DEFICITÁRIA">Deficitária</option><option value="OK">OK</option>
            </select> },
            { label: 'Busca PT/ND', node: <input value={busca} onChange={e => { setBusca(e.target.value); setProgPage(0); }} placeholder="Código ou descrição…" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 13, minWidth: 200 }} /> },
          ].map(({ label, node }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginBottom: 4, textTransform: 'uppercase' as const }}>{label}</div>
              {node}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 16 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
          <KPI label="Empenhado 2026" value={Rb(kpi.emp)} sub={`${kpi.n} UOs analisadas`} />
          <KPI label="Déficit Projetado 2026" value={Rb(kpi.def26)} sub="Projeção × saldo disponível" warn />
          <KPI label="Déficit Realizado 2025" value={Rb(kpi.def25)} sub="Liquidado 2025 − Autorizado 2026" warn={kpi.def25 < 0} />
          <KPI label="UOs Deficitárias" value={`${kpi.nDef} / ${kpi.n}`} sub="Projeção 2026 > saldo disponível" warn={kpi.nDef > 0} />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(430px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Top UOs — Déficit vs Projeção 2026 (R$ M)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v as number).toFixed(0)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="deficit" name="Déficit" fill={RED} radius={[0, 4, 4, 0]} />
                <Bar dataKey="projecao" name="Projeção" fill={BLUE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Autorizado × Projeção × Liquidado por UO (R$ M)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparChart} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${((v as number) / 1000).toFixed(0)}B`} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Autorizado" fill={GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Projeção 2026" fill={RED} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Liquidado 2025" fill={ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Situação das UOs</div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={sitPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {sitPie.map((_, i) => <Cell key={i} fill={i === 0 ? RED : GREEN} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Déficit por GND (R$ M)</div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={gndPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${(value as number).toFixed(0)}M`}>
                  {gndPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => Rm(v * 1e6)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela UOs */}
        <div style={{ ...card, marginBottom: 16, overflowX: 'auto' as const }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Resumo por UO</div>
            <div style={{ fontSize: 12, color: GREY }}>{filtUO.length} UOs</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Cód.', 'UO', 'Empenhado 2026', 'Projeção 2026', 'Saldo', 'Déficit 2026', 'Déficit 2025', 'Situação'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtUO.slice(uoPage * PG, (uoPage + 1) * PG).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ ...tdStyle, color: GREY }}>{r.uo_cod}</td>
                  <td style={{ ...tdStyle, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={r.uo_nome}>{abrev(r.uo_nome, 35)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{Rm(r.empenhado_2026)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{Rm(r.projecao_2026)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{Rm(r.saldo_total)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.deficit_2026 < 0 ? RED : GREEN, fontWeight: 600 }}>{Rm(r.deficit_2026)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.deficit_2025 < 0 ? RED : GREEN }}>{Rm(r.deficit_2025)}</td>
                  <td style={tdStyle}><Badge ok={r.situacao !== 'DEFICITÁRIA'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={uoPage} total={filtUO.length} onPage={setUoPage} />
        </div>

        {/* Tabela Programações */}
        <div style={{ ...card, overflowX: 'auto' as const }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Programações detalhadas (PT / ND)</div>
            <div style={{ fontSize: 12, color: GREY }}>{filtProg.length} registros</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['UO', 'PT', 'Descrição', 'Fonte', 'ND', 'GND', 'Empenhado', 'Projeção', 'Saldo', 'Déficit 2026'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtProg.slice(progPage * PG, (progPage + 1) * PG).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ ...tdStyle, color: GREY }}>{r.uo_cod}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' as const }}>{r.pt_cod}</td>
                  <td style={{ ...tdStyle, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={r.pt_desc}>{abrev(r.pt_desc, 32)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' as const }}>{r.fonte}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' as const }}>{r.nd}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' as const }}>{r.gnd}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }}>{Rm(r.empenhado)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }}>{Rm(r.projecao_2026)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }}>{Rm(r.saldo_total)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, whiteSpace: 'nowrap' as const, color: r.deficit_2026 < 0 ? RED : GREEN, fontWeight: 600 }}>{Rm(r.deficit_2026)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={progPage} total={filtProg.length} onPage={setProgPage} />
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: GREY, padding: '16px 0 8px' }}>
          CODIM / SUOP / SEFIN · Dados: Análise de Déficit Orçamentário 2026
        </div>
      </div>
    </div>
  );
}
