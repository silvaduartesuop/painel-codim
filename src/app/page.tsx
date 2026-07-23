'use client';
import { useState, useEffect, useMemo } from 'react';

interface UO {
  uo_cod: string; uo_nome: string; empenhado_2026: number; projecao_2026: number;
  saldo_total: number; deficit_2026: number; deficit_2025: number; situacao: string;
  autorizado_2026: number; n_programacoes: number;
}
interface Prog {
  uo_cod: string; uo_nome: string; pt_cod: string; pt_desc: string;
  fonte: string; nd: number; gnd: string; empenhado: number;
  projecao_2026: number; saldo_total: number; deficit_2026: number;
}
interface DashData { por_uo: UO[]; por_prog: Prog[]; }

const Rm = (n: number) => `R$ ${(n / 1e6).toFixed(1)}M`;
const Rb = (n: number) => `R$ ${(n / 1e9).toFixed(2)}B`;
const abrev = (s: string, mx = 30) => s.length > mx ? s.slice(0, mx) + '\u2026' : s;
const PG = 10;
const RED = '#dc2626', BLUE = '#2563eb', GREEN = '#16a34a', GREY = '#6b7280';

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
    emp:  filtUO.reduce((s, r) => s + r.empenhado_2026, 0),
    def26: filtUO.reduce((s, r) => s + (r.deficit_2026 < 0 ? r.deficit_2026 : 0), 0),
    def25: filtUO.reduce((s, r) => s + (r.deficit_2025 < 0 ? r.deficit_2025 : 0), 0),
    nDef: filtUO.filter(r => r.situacao === 'DEFICIT\u00C1RIA').length,
    n: filtUO.length,
  }), [filtUO]);

  const top10 = useMemo(() =>
    [...filtUO].sort((a, b) => a.deficit_2026 - b.deficit_2026).slice(0, 10),
    [filtUO]);
  const maxDef = top10.length ? Math.abs(top10[0].deficit_2026) || 1 : 1;

  const uoOpts = useMemo(() =>
    data ? [...new Map(data.por_uo.map(r => [r.uo_cod, r.uo_nome] as [string,string])).entries()] : [],
    [data]);

  if (!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color: GREY, fontSize: 16 }}>
      Carregando dados…
    </div>
  );

  const card: React.CSSProperties = { background:'#fff', borderRadius:10, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.08)' };
  const selStyle: React.CSSProperties = { padding:'6px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.12)', color:'#fff', fontSize:13 };
  const thS: React.CSSProperties = { textAlign:'left', padding:'8px 10px', color:GREY, fontWeight:600, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap', borderBottom:'2px solid #e5e7eb' };
  const tdS: React.CSSProperties = { padding:'8px 10px', borderBottom:'1px solid #f3f4f6', fontSize:12.5 };
  const btnBase: React.CSSProperties = { padding:'4px 10px', border:'1px solid #e5e7eb', borderRadius:5 };

  const Pager = ({ page, total, set }: { page:number; total:number; set:(n:number)=>void }) => {
    const last = Math.ceil(total/PG)-1;
    if (total <= PG) return null;
    return (
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12, fontSize:12, color:GREY, alignItems:'center' }}>
        <button style={{ ...btnBase, opacity: page===0?.4:1, cursor: page===0?'not-allowed':'pointer' }} onClick={() => set(page-1)} disabled={page===0}>\u2039</button>
        <span>Pág. {page+1} / {last+1}</span>
        <button style={{ ...btnBase, opacity: page>=last?.4:1, cursor: page>=last?'not-allowed':'pointer' }} onClick={() => set(page+1)} disabled={page>=last}>\u203a</button>
      </div>
    );
  };

  return (
    <div style={{ background:'#f4f6f9', minHeight:'100vh', fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <div style={{ background:'#142850', color:'#fff', padding:'16px 24px 20px' }}>
        <div style={{ fontSize:20, fontWeight:700 }}>Painel de Déficit Orçamentário</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4 }}>CODIM / SUOP / SEFIN — Projeção 2026 vs Liquidado 2025</div>
        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
          <select value={filterUO} onChange={e=>{ setFilterUO(e.target.value); setUoPage(0); setProgPage(0); }} style={{ ...selStyle, minWidth:200 }}>
            <option value="">Todas as UOs</option>
            {uoOpts.map(([cod,nome]) => <option key={cod} value={cod}>{abrev(nome,40)}</option>)}
          </select>
          <select value={filterSit} onChange={e=>{ setFilterSit(e.target.value); setUoPage(0); }} style={selStyle}>
            <option value="">Todas as situações</option>
            <option value="DEFICIT\u00C1RIA">Deficitária</option>
            <option value="OK">OK</option>
          </select>
          <input value={busca} onChange={e=>{ setBusca(e.target.value); setProgPage(0); }} placeholder="Buscar PT / descrição…" style={{ ...selStyle, minWidth:200 }} />
        </div>
      </div>

      <div style={{ maxWidth:1440, margin:'0 auto', padding:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:16 }}>
          {([
            { label:'Empenhado 2026', value:Rb(kpi.emp), sub:`${kpi.n} UOs analisadas`, warn:false },
            { label:'Déficit Projetado 2026', value:Rb(kpi.def26), sub:'Projeção × saldo disponível', warn:true },
            { label:'Déficit Realizado 2025', value:Rb(kpi.def25), sub:'Liquidado 2025 − Autorizado 2026', warn:kpi.def25<0 },
            { label:'UOs Deficitárias', value:`${kpi.nDef} / ${kpi.n}`, sub:'Projeção 2026 > saldo', warn:kpi.nDef>0 },
          ] as const).map(k => (
            <div key={k.label} style={{ ...card, borderLeft:`4px solid ${k.warn?RED:BLUE}` }}>
              <div style={{ fontSize:11, color:GREY, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>{k.label}</div>
              <div style={{ fontSize:24, fontWeight:700, color:k.warn?RED:'#111' }}>{k.value}</div>
              <div style={{ fontSize:12, color:GREY, marginTop:4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Top 10 UOs — Déficit Projetado 2026</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {top10.map((r,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'200px 1fr 90px', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:12, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.uo_nome}>
                  {abrev(r.uo_nome.split(' ').slice(-2).join(' '),26)}
                </div>
                <div style={{ background:'#fee2e2', borderRadius:4, height:18, overflow:'hidden' }}>
                  <div style={{ width:`${(Math.abs(r.deficit_2026)/maxDef)*100}%`, background:RED, height:'100%', borderRadius:4 }} />
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:RED, textAlign:'right' }}>{Rm(-r.deficit_2026)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, marginBottom:16, overflowX:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:14 }}>Resumo por UO</div>
            <div style={{ fontSize:12, color:GREY }}>{filtUO.length} UOs</div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{(['Cód.','UO','Empenhado 2026','Projeção 2026','Saldo','Déficit 2026','Déficit 2025','Situação']).map(c=><th key={c} style={thS}>{c}</th>)}</tr></thead>
            <tbody>
              {filtUO.slice(uoPage*PG,(uoPage+1)*PG).map((r,i)=>(
                <tr key={i}>
                  <td style={tdS}>{r.uo_cod}</td>
                  <td style={{ ...tdS, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.uo_nome}>{abrev(r.uo_nome,35)}</td>
                  <td style={{ ...tdS, textAlign:'right' }}>{Rm(r.empenhado_2026)}</td>
                  <td style={{ ...tdS, textAlign:'right' }}>{Rm(r.projecao_2026)}</td>
                  <td style={{ ...tdS, textAlign:'right' }}>{Rm(r.saldo_total)}</td>
                  <td style={{ ...tdS, textAlign:'right', color:r.deficit_2026<0?RED:GREEN, fontWeight:600 }}>{Rm(r.deficit_2026)}</td>
                  <td style={{ ...tdS, textAlign:'right', color:r.deficit_2025<0?RED:GREEN }}>{Rm(r.deficit_2025)}</td>
                  <td style={tdS}><span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:r.situacao!=='DEFICIT\u00C1RIA'?'#dcfce7':'#fee2e2', color:r.situacao!=='DEFICIT\u00C1RIA'?GREEN:RED }}>{r.situacao==='DEFICIT\u00C1RIA'?'DEFICIT\u00C1RIA':'OK'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={uoPage} total={filtUO.length} set={setUoPage} />
        </div>

        <div style={{ ...card, overflowX:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:14 }}>Programações detalhadas (PT / ND)</div>
            <div style={{ fontSize:12, color:GREY }}>{filtProg.length} registros</div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{(['UO','PT','Descrição','Fonte','ND','GND','Empenhado','Projeção','Saldo','Déficit 2026']).map(c=><th key={c} style={thS}>{c}</th>)}</tr></thead>
            <tbody>
              {filtProg.slice(progPage*PG,(progPage+1)*PG).map((r,i)=>(
                <tr key={i}>
                  <td style={tdS}>{r.uo_cod}</td>
                  <td style={{ ...tdS, fontFamily:'monospace', fontSize:11, whiteSpace:'nowrap' }}>{r.pt_cod}</td>
                  <td style={{ ...tdS, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.pt_desc}>{abrev(r.pt_desc,32)}</td>
                  <td style={{ ...tdS, textAlign:'center' }}>{r.fonte}</td>
                  <td style={{ ...tdS, textAlign:'center' }}>{r.nd}</td>
                  <td style={{ ...tdS, textAlign:'center' }}>{r.gnd}</td>
                  <td style={{ ...tdS, textAlign:'right', whiteSpace:'nowrap' }}>{Rm(r.empenhado)}</td>
                  <td style={{ ...tdS, textAlign:'right', whiteSpace:'nowrap' }}>{Rm(r.projecao_2026)}</td>
                  <td style={{ ...tdS, textAlign:'right', whiteSpace:'nowrap' }}>{Rm(r.saldo_total)}</td>
                  <td style={{ ...tdS, textAlign:'right', whiteSpace:'nowrap', color:r.deficit_2026<0?RED:GREEN, fontWeight:600 }}>{Rm(r.deficit_2026)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={progPage} total={filtProg.length} set={setProgPage} />
        </div>
        <div style={{ textAlign:'center', fontSize:12, color:GREY, padding:'16px 0 8px' }}>CODIM / SUOP / SEFIN · Análise de Déficit Orçamentário 2026</div>
      </div>
    </div>
  );
}
