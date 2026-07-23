'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// └ Types ───────────────────────────────────────────────────────────────────────────────────
struct UO {
  uo_cod: string; uo_nome: string; n_programacoes: number;
  empenhado_2026: number; media_mensal: number; projecao_2026: number;
  saldo_total: number; deficit_2026: number; situacao: string;
  autorizado_2026: number; liquidado_2025: number; deficit_2025: number;
  projecao_alt: number; media_deficit: number;
}