import { useState, useEffect, useContext } from 'react';
import { FiDollarSign, FiCalendar, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import Header from '../../components/Header';
import Title from '../../components/Title';
import { db } from '../../services/firebaseConnection';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { AuthContext } from '../../contexts/auth';
import { toast } from 'react-toastify';
import './payment.css';

export default function Payments() {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [type, setType] = useState('receita');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('mensal');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [editId, setEditId] = useState(null);
  
  const [totalReceived, setTotalReceived] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [profit, setProfit] = useState(0);
  const [companyStatus, setCompanyStatus] = useState(0);

  useEffect(() => {
    async function loadData() {
      const clientsSnapshot = await getDocs(collection(db, "customers"));
      const clientsList = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsList);

      const projectsSnapshot = await getDocs(collection(db, "projetos"));
      const projectsList = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsList);

      await loadPayments();
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [payments]);

  async function loadPayments() {
    const paymentsRef = collection(db, "payments");
    const paymentsSnapshot = await getDocs(paymentsRef);
    
    const paymentsList = [];
    paymentsSnapshot.forEach(doc => {
      paymentsList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    paymentsList.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setPayments(paymentsList);
  }

  function calculateTotals() {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    let received = 0;
    let paid = 0;
    let allTimeReceived = 0;
    let allTimePaid = 0;
    
    payments.forEach(payment => {
      const paymentDate = parseISO(payment.date);
      
      if (paymentDate >= monthStart && paymentDate <= monthEnd) {
        if (payment.type === 'receita') {
          received += parseFloat(payment.amount);
        } else {
          paid += parseFloat(payment.amount);
        }
      }
      
      if (payment.type === 'receita') {
        allTimeReceived += parseFloat(payment.amount);
      } else {
        allTimePaid += parseFloat(payment.amount);
      }
    });
    
    const profitValue = received - paid;
    const statusValue = allTimeReceived - allTimePaid;
    
    setTotalReceived(received);
    setTotalPaid(paid);
    setProfit(profitValue);
    setCompanyStatus(statusValue);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!amount || !description) {
      toast.error("Preencha valor e descrição!");
      return;
    }
    
    const paymentData = {
      type,
      amount: parseFloat(amount),
      description,
      frequency,
      date,
      clientId: clientId || null,
      projectId: projectId || null,
      userId: user.uid,
      createdAt: new Date()
    };
    
    try {
      if (editId) {
        const paymentRef = doc(db, "payments", editId);
        await updateDoc(paymentRef, paymentData);
        toast.success("Pagamento atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "payments"), paymentData);
        toast.success("Pagamento registrado com sucesso!");
      }
      
      resetForm();
      await loadPayments();
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      toast.error("Erro ao salvar pagamento!");
    }
  }

  function resetForm() {
    setType('receita');
    setAmount('');
    setDescription('');
    setFrequency('mensal');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setClientId('');
    setProjectId('');
    setEditId(null);
  }

  function handleEdit(payment) {
    setType(payment.type);
    setAmount(payment.amount.toString());
    setDescription(payment.description);
    setFrequency(payment.frequency);
    setDate(format(parseISO(payment.date), 'yyyy-MM-dd'));
    setClientId(payment.clientId || '');
    setProjectId(payment.projectId || '');
    setEditId(payment.id);
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
      try {
        await deleteDoc(doc(db, "payments", id));
        toast.success("Pagamento excluído com sucesso!");
        await loadPayments();
      } catch (error) {
        console.error("Erro ao excluir pagamento:", error);
        toast.error("Erro ao excluir pagamento!");
      }
    }
  }

  return (
    <div>
      <Header />
      
      <div className="content">
        <Title name="Pagamentos">
          <FiDollarSign size={25} />
        </Title>
        
        <div className="container">
          <div className="form-section">
            <h2>{editId ? 'Editar Pagamento' : 'Novo Pagamento'}</h2>
            
            <form className="form-payment" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo</label>
                <div className="radio-group">
                  <button 
                    type="button"
                    className={`radio-btn ${type === 'receita' ? 'active' : ''}`}
                    onClick={() => setType('receita')}
                  >
                    Receita
                  </button>
                  <button 
                    type="button"
                    className={`radio-btn ${type === 'despesa' ? 'active' : ''}`}
                    onClick={() => setType('despesa')}
                  >
                    Despesa
                  </button>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Frequência</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  placeholder="Descrição do pagamento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Cliente (opcional)</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.nomeFantasia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Projeto (opcional)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Selecione um projeto</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.assunto}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editId ? 'Atualizar' : 'Salvar Pagamento'}
                </button>
                
                {editId && (
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <div className="summary-section">
            <div className="summary-header">
              <h2>Resumo Financeiro</h2>
              <div className="current-month">
                {format(new Date(), 'MMMM yyyy')}
              </div>
            </div>
            
            <div className="summary-grid">
              <div className="summary-item received">
                <span>Total Recebido</span>
                <strong>
                  {totalReceived.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </strong>
              </div>
              
              <div className="summary-item paid">
                <span>Total Pago</span>
                <strong>
                  {totalPaid.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </strong>
              </div>
              
              <div className="summary-item profit">
                <span>Lucro</span>
                <strong>
                  {profit.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </strong>
              </div>
              
              <div className="summary-item status">
                <span>Saldo Total</span>
                <strong>
                  {companyStatus.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </strong>
              </div>
            </div>
          </div>
          
          <div className="payments-list">
            <div className="list-header">
              <h2>
                <FiCalendar size={20} />
                Histórico de Pagamentos
              </h2>
            </div>
            
            {loading ? (
              <div className="loading">Carregando pagamentos...</div>
            ) : payments.length === 0 ? (
              <div className="empty">Nenhum pagamento registrado</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                      <th>Tipo</th>
                      <th>Frequência</th>
                      <th>Cliente/Projeto</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{format(parseISO(payment.date), 'dd/MM/yyyy')}</td>
                        <td>{payment.description}</td>
                        <td className={payment.type === 'receita' ? 'positive' : 'negative'}>
                          {payment.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${payment.type}`}>
                            {payment.type === 'receita' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td>
                          {payment.frequency === 'diario' && 'Diário'}
                          {payment.frequency === 'semanal' && 'Semanal'}
                          {payment.frequency === 'quinzenal' && 'Quinzenal'}
                          {payment.frequency === 'mensal' && 'Mensal'}
                        </td>
                        <td>
                          {payment.clientId && 
                            clients.find(c => c.id === payment.clientId)?.nomeFantasia}
                          {payment.projectId && 
                            ` / ${projects.find(p => p.id === payment.projectId)?.assunto}`}
                        </td>
                        <td className="actions">
                          <button 
                            className="edit"
                            onClick={() => handleEdit(payment)}
                            title="Editar"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            className="delete"
                            onClick={() => handleDelete(payment.id)}
                            title="Excluir"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}