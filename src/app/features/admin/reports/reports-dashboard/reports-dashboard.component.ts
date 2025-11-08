import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  category: string;
  keyMetrics: string[];
  usage: string;
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
      title: 'Reporte Financiero',
      description: 'Base devengada (accrual accounting) para cumplimiento tributario',
      icon: '📊',
      route: '/admin/reports/financial',
      color: 'green',
      category: 'Tributario',
      keyMetrics: ['Ingresos/Gastos totales', 'IVA débito/crédito', 'Ganancia neta', 'Margen de rentabilidad'],
      usage: 'Declaración mensual de IVA al SII'
    },
    {
      title: 'Flujo de Caja',
      description: 'Base efectivo (cash accounting) para gestión de tesorería',
      icon: '💵',
      route: '/admin/reports/cash-flow',
      color: 'teal',
      category: 'Tesorería',
      keyMetrics: ['Efectivo recibido', 'Efectivo pagado', 'Flujo neto', 'Margen de flujo'],
      usage: 'Control de liquidez y caja disponible'
    },
    {
      title: 'Rentabilidad de Viajes',
      description: 'Análisis de ingresos, gastos y margen por viaje completado',
      icon: '🚛',
      route: '/admin/reports/trip-profitability',
      color: 'blue',
      category: 'Operacional',
      keyMetrics: ['Ingresos por viaje', 'Costos operativos', 'Margen de ganancia', 'km recorridos'],
      usage: 'Identificar viajes rentables vs. no rentables'
    },
    {
      title: 'Gastos por Categoría',
      description: 'Desglose y distribución de gastos por tipo de categoría',
      icon: '📈',
      route: '/admin/reports/expenses',
      color: 'purple',
      category: 'Análisis',
      keyMetrics: ['Monto por categoría', 'Porcentaje del total', 'Tendencias', 'Comparativas'],
      usage: 'Optimizar estructura de costos'
    }
  ];

  getColorClasses(color: string): {
    bg: string;
    bgHover: string;
    border: string;
    text: string;
    badge: string;
    badgeText: string;
  } {
    const colors: Record<string, {
      bg: string;
      bgHover: string;
      border: string;
      text: string;
      badge: string;
      badgeText: string;
    }> = {
      blue: {
        bg: 'bg-blue-50',
        bgHover: 'group-hover:bg-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100',
        badgeText: 'text-blue-800'
      },
      green: {
        bg: 'bg-green-50',
        bgHover: 'group-hover:bg-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        badge: 'bg-green-100',
        badgeText: 'text-green-800'
      },
      teal: {
        bg: 'bg-teal-50',
        bgHover: 'group-hover:bg-teal-100',
        border: 'border-teal-200',
        text: 'text-teal-700',
        badge: 'bg-teal-100',
        badgeText: 'text-teal-800'
      },
      purple: {
        bg: 'bg-purple-50',
        bgHover: 'group-hover:bg-purple-100',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100',
        badgeText: 'text-purple-800'
      },
    };
    return colors[color] || colors['blue'];
  }
}
