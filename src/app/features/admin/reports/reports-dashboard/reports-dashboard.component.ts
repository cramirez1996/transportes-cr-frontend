import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss'
})
export class ReportsDashboardComponent {
  reports: ReportCard[] = [
    {
      title: 'Rentabilidad de Viajes',
      description: 'Análisis detallado de ingresos, gastos y rentabilidad por viaje. Identifica los viajes más y menos rentables.',
      icon: '🚛',
      route: '/admin/reports/trip-profitability',
      color: 'blue'
    },
    {
      title: 'Reporte Financiero Mensual',
      description: 'Resumen financiero completo con ingresos, gastos, IVA débito/crédito y ganancia neta del mes.',
      icon: '💰',
      route: '/admin/reports/financial',
      color: 'green'
    },
    {
      title: 'Gastos por Categoría',
      description: 'Desglose de gastos por categoría con porcentajes y gráficos visuales. Identifica áreas de mayor gasto.',
      icon: '📊',
      route: '/admin/reports/expenses',
      color: 'purple'
    }
  ];

  getColorClasses(color: string): { bg: string; border: string; text: string } {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    };
    return colors[color] || colors['blue'];
  }
}
