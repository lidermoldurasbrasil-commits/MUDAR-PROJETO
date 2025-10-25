import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X, Filter, FilterX, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/gestao/financeiro`;

const TIPOS_CONTA = ['Corrente', 'Poupança', 'Caixa', 'Mercado Pago', 'Shopee'];
const BANCOS_DISPONIVEIS = ['Itaú', 'Bradesco', 'Banco do Brasil', 'Mercado Pago'];
const FORMAS_PAGAMENTO = ['Cartão Crédito', 'Cartão Débito', 'PIX', 'Boleto'];
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo'];

export default function ContasBancarias() {
  const { lojaAtual } = useOutletContext();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [formasPagamento, setFormasPagamento] = useState({});

  useEffect(() => { fetchContas(); }, [lojaAtual]);

  const fetchContas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/contas-bancarias?loja=${lojaAtual}`, { headers: { Authorization: `Bearer ${token}` } });
      setContas(response.data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (contaId) => {
    if (expandedId === contaId) {
      setExpandedId(null);
    } else {
      setExpandedId(contaId);
      if (!formasPagamento[contaId]) {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/contas-bancarias/${contaId}/formas-pagamento`, { headers: { Authorization: `Bearer ${token}` } });
        setFormasPagamento(prev => ({ ...prev, [contaId]: res.data }));
      }
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{padding: '20px'}}>
      <h1>Contas Bancárias (Clique na conta para ver formas de pagamento)</h1>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{background: '#5dceaa', color: 'white'}}>
            <th style={{padding: '12px', textAlign: 'left'}}>▼</th>
            <th style={{padding: '12px', textAlign: 'left'}}>Nome</th>
            <th style={{padding: '12px', textAlign: 'left'}}>Banco</th>
            <th style={{padding: '12px', textAlign: 'left'}}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {contas.map(conta => (
            <>
              <tr key={conta.id} onClick={() => toggleExpand(conta.id)} style={{cursor: 'pointer', borderBottom: '1px solid #e2e8f0'}}>
                <td style={{padding: '12px'}}>{expandedId === conta.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</td>
                <td style={{padding: '12px'}}>{conta.nome}</td>
                <td style={{padding: '12px'}}>{conta.banco}</td>
                <td style={{padding: '12px'}}>R$ {conta.saldo_atual}</td>
              </tr>
              {expandedId === conta.id && (
                <tr>
                  <td colSpan="4" style={{padding: '20px', background: '#f9fafb'}}>
                    <h3>{conta.nome} - Formas de Pagamento</h3>
                    <table style={{width: '100%', background: 'white'}}>
                      <thead>
                        <tr style={{background: '#e2e8f0'}}>
                          <th style={{padding: '8px'}}>Forma</th>
                          <th style={{padding: '8px'}}>Parcelas</th>
                          <th style={{padding: '8px'}}>Taxa %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formasPagamento[conta.id]?.map(forma => (
                          <tr key={forma.id}>
                            <td style={{padding: '8px'}}>{forma.forma_pagamento}</td>
                            <td style={{padding: '8px'}}>{forma.numero_parcelas}x</td>
                            <td style={{padding: '8px'}}>{forma.taxa_banco_percentual}%</td>
                          </tr>
                        ))}
                        {(!formasPagamento[conta.id] || formasPagamento[conta.id].length === 0) && (
                          <tr><td colSpan="3" style={{padding: '20px', textAlign: 'center', color: '#718096'}}>Nenhuma forma configurada</td></tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}