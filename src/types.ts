export type Periodo = 'matutino' | 'vespertino' | 'noturno';
export type EquipamentoTipo = 'Datashow' | 'Notebook' | 'Microfone' | 'Caixa de som';
export type EquipStatus = 'disponivel' | 'manutencao';

export interface Equipamento {
  id: string
  identificacao: string
  nome: string
  tipo: EquipamentoTipo
  bloco: 'B' | 'C' | 'D'
  status: EquipStatus
}

export interface ReservaItem {
  id: string
  data: string
  periodo: Periodo
  bloco: 'B' | 'C' | 'D'
  salaId: string | null        // agora pode ser null
  equipamentoId: string | null // agora pode ser null
  solicitante: string
  observacoes?: string
  status: 'pendente' | 'aprovado' | 'cancelado'
}


export type DemandaTipo = 'acao' | 'campanha' | 'evento';

export type ChecklistItem = {
  solicitado: boolean;
  concluido: boolean;
  responsavel?: string;
};

export interface MarketingSolicitacao {
  id: string;
  criadoEm: string;
  solicitante: string;
  setorCurso: string;
  telefone: string;
  email: string;
  demanda: DemandaTipo;
  titulo: string;
  data: string;
  horario: string;
  local: string;

  criacao: {
    banner90x120: ChecklistItem;
    cartazA4: ChecklistItem;
    cartazA3: ChecklistItem;
    cracha9x13: ChecklistItem;
    postOnline: ChecklistItem;
    emailMkt: ChecklistItem;
  };
  divulgacao: {
    materiaImprensa: ChecklistItem;
    materiaSite: ChecklistItem;
    attSite: ChecklistItem;
    divulgacaoSite: ChecklistItem;
  };
  outros: {
    fixacaoCampus: ChecklistItem;
    registroFoto: ChecklistItem;
    filmagem: ChecklistItem;
    outros: ChecklistItem;
    descricaoOutros?: string;
  };

  // ✅ Adicionado campo de aprovações hierárquicas
  aprovacoes: {
    coordenador: {
      aprovado: boolean | null;
      por?: string;
      data?: string;
    };
    diretor: {
      aprovado: boolean | null;
      por?: string;
      data?: string;
    };
    vice: {
      aprovado: boolean | null;
      por?: string;
      data?: string;
    };
  };

  status: 'aberta' | 'pendente' | 'em_andamento' | 'concluida' | 'recusada';
  concluidaEm?: string;
}
