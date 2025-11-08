// src/types/auth.ts
export type Papel =
  | 'solicitante'
  | 'responsavel'   // Parecer do Responsável
  | 'diretor'       // Parecer do diretor da área
  | 'vice'          // Parecer da vice-reitoria
  | 'marketing'     // Equipe executora (opcional)

export type Usuario = {
  uid: string
  nome: string
  email?: string
  papel: Papel
  setor?: string
}
