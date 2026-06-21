import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateStr), pattern, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM/yyyy', { locale: ptBR });
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    aviso: 'Aviso',
    manutencao: 'Manutenção',
    evento: 'Evento',
    financeiro: 'Financeiro',
  };
  return map[category] ?? category;
}

export function getAmenityLabel(type: string): string {
  const map: Record<string, string> = {
    salao_festas: 'Salão de Festas',
    piscina: 'Piscina',
    churrasqueira: 'Churrasqueira',
    academia: 'Academia',
    quadra: 'Quadra',
    outro: 'Outro',
  };
  return map[type] ?? type;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Recusado',
    cancelled: 'Cancelado',
  };
  return map[status] ?? status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#F57F17',
    approved: '#2E7D32',
    rejected: '#C62828',
    cancelled: '#9AA3AF',
  };
  return map[status] ?? '#9AA3AF';
}
