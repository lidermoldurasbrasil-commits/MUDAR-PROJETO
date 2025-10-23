// Traduções PT-BR para o sistema
export const translations = {
  // Status
  status: {
    'Designing': 'Projetando',
    'Printing': 'Imprimindo',
    'In Production': 'Em Produção',
    'Quality Check': 'Controle de Qualidade',
    'Shipped': 'Enviado',
    'Pending': 'Pendente',
    'Under Review': 'Em Análise',
    'Approved for Refund': 'Aprovado para Reembolso',
    'Resolved': 'Resolvido',
    'Approved': 'Aprovado',
    'Rejected': 'Rejeitado',
    'Overdue': 'Atrasado',
    'Paid': 'Pago',
    'To Do': 'A Fazer',
    'In Progress': 'Em Andamento',
    'Review': 'Revisão',
    'Published': 'Publicado',
    'Sent to Supplier': 'Enviado ao Fornecedor',
    'In Transit': 'Em Trânsito',
    'Delivered': 'Entregue',
    'Created': 'Criado',
    'Not Resolved': 'Não Resolvido',
    'Artwork Creation': 'Criação de Arte',
    'Client Approval': 'Aprovação do Cliente',
    'Production': 'Produção',
    'Ready': 'Pronto',
    'New Lead': 'Novo Lead',
    'In Contact': 'Em Contato',
    'Proposal Sent': 'Proposta Enviada',
    'Converted': 'Convertido',
    'Lost': 'Perdido'
  },
  
  // Plataformas
  platforms: {
    'Shopee': 'Shopee',
    'Mercado Livre': 'Mercado Livre',
    'TikTok': 'TikTok',
    'Marketplace': 'Marketplace'
  },
  
  // Mensagens comuns
  messages: {
    'Error loading items': 'Erro ao carregar itens',
    'Item created': 'Item criado',
    'Item updated': 'Item atualizado',
    'Item deleted': 'Item excluído',
    'Error saving item': 'Erro ao salvar item',
    'Error deleting item': 'Erro ao excluir item',
    'Delete this item?': 'Excluir este item?',
    'Loading...': 'Carregando...'
  }
};

export const t = (key, category = 'status') => {
  return translations[category]?.[key] || key;
};
