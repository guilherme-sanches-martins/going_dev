export type Periodo = 'matutino' | 'vespertino' | 'noturno';

export type EquipamentoTipo = 'Datashow' | 'Notebook' | 'Microfone' | 'Caixa de som';

export type EquipStatus = 'disponivel' | 'manutencao';

export interface Equipamento {
  id: string;
  nome: string;
  tipo: EquipamentoTipo;
  bloco: 'B' | 'C' | 'D';
  status: EquipStatus;
}

export interface ReservaItem {
  id: string;             // uuid
  data: string;           // 'YYYY-MM-DD'
  periodo: Periodo;
  bloco: 'B' | 'C' | 'D';
  salaId: string;         // ex: 'B203'
  equipamentoId: string;
  solicitante: string;
  observacoes?: string;
  status: 'pendente' | 'aprovado';
}

