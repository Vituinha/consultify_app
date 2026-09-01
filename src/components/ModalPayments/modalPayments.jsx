import { useState, useEffect, useContext } from 'react';
import { FiPlusCircle, FiX, FiCalendar, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import CurrencyInput from 'react-currency-input-field';
import { AuthContext } from '../../contexts/auth';
import { db } from '../../services/firebaseConnection';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function Payments() {
  const { user } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [formData, setFormData] = useState({
    project: '',
    paymentType: 'recebimento',
    customer: '',
    description: '',
    totalValue: '',
    paymentDate: '',
    installments: 1,
    installmentInterval: 'mensal',
    paymentMethod: '',
    generatedInstallments: []
  });

  // Carregar pagamentos do Firebase
  useEffect(() => {
    async function loadPayments() {
      try {
        const paymentsRef = collection(db, "payments");
        const q = query(
          paymentsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        const paymentsList = [];
        
        snapshot.forEach((doc) => {
          paymentsList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setPayments(paymentsList);
        setLoading(false);
        
        if (snapshot.empty) {
          toast.info("Nenhum pagamento encontrado. Adicione seu primeiro pagamento.");
        }
      } catch (error) {
        console.error("Erro ao carregar pagamentos:", error);
        toast.error("Erro ao carregar lista de pagamentos");
        setLoading(false);
      }
    }
    
    loadPayments();
  }, [user.uid]);

  // Manipular mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gerar parcelas
  const generateInstallments = () => {
    const { paymentDate, totalValue, installments, installmentInterval } = formData;
    
    if (!paymentDate || !totalValue || installments < 1) {
      toast.error("Preencha a data, valor total e número de parcelas");
      return;
    }
    
    const numericValue = parseFloat(totalValue.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numericValue)) {
      toast.error("Valor total inválido");
      return;
    }
    
    const installmentValue = numericValue / installments;
    const installmentsList = [];
    const startDate = new Date(paymentDate);
    
    for (let i = 0; i < installments; i++) {
      const installmentDate = new Date(startDate);
      
      if (installmentInterval === 'mensal') {
        installmentDate.setMonth(startDate.getMonth() + i);
      } else if (installmentInterval === 'quinzenal') {
        installmentDate.setDate(startDate.getDate() + (i * 15));
      } else if (installmentInterval === 'semanal') {
        installmentDate.setDate(startDate.getDate() + (i * 7));
      }
      
      installmentsList.push({
        number: i + 1,
        date: installmentDate.toISOString().split('T')[0],
        value: installmentValue.toFixed(2)
      });
    }
    
    setFormData(prev => ({
      ...prev,
      generatedInstallments: installmentsList
    }));
    
    toast.success(`${installments} parcelas geradas com sucesso!`);
  };

  // Salvar transação no Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { description, totalValue, paymentDate, generatedInstallments, ...rest } = formData;
    
    if (!description || !totalValue || !paymentDate) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    if (generatedInstallments.length === 0) {
      toast.error("Gere as parcelas antes de salvar");
      return;
    }
    
    try {
      const numericValue = parseFloat(totalValue.replace(/[^\d,]/g, '').replace(',', '.'));
      
      await addDoc(collection(db, "payments"), {
        ...rest,
        description,
        totalValue: numericValue,
        paymentDate,
        installments: generatedInstallments,
        userId: user.uid,
        createdAt: new Date()
      });
      
      toast.success("Transação salva com sucesso!");
      setIsModalOpen(false);
      setFormData({
        project: '',
        paymentType: 'recebimento',
        customer: '',
        description: '',
        totalValue: '',
        paymentDate: '',
        installments: 1,
        installmentInterval: 'mensal',
        paymentMethod: '',
        generatedInstallments: []
      });
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Adicionar Transação
        </button>
      </div>

      {/* Lista de pagamentos */}
      {loading ? (
        <p>Carregando pagamentos...</p>
      ) : payments.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-600">Nenhum pagamento encontrado...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    R$ {payment.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.paymentType === 'recebimento' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.paymentType === 'recebimento' ? 'Recebimento' : 'Pagamento'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Adicionar Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Adicionar Transação</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Projeto e Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Projeto (opcional)
                    </label>
                    <input
                      type="text"
                      name="project"
                      value={formData.project}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do projeto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de transação
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'recebimento' }))}
                        className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
                          formData.paymentType === 'recebimento' 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Recebimento
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'pagamento' }))}
                        className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${
                          formData.paymentType === 'pagamento' 
                            ? 'bg-red-100 border-red-500 text-red-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Pagamento
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Cliente */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cliente (opcional)
                  </label>
                  <input
                    type="text"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>
                
                {/* Descrição */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição da transação"
                    required
                  />
                </div>
                
                {/* Valor e Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Valor total <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiDollarSign />
                      </span>
                      <CurrencyInput
                        name="totalValue"
                        value={formData.totalValue}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, totalValue: value }))}
                        intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                        decimalSeparator=","
                        groupSeparator="."
                        prefix="R$ "
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Data de pagamento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiCalendar />
                      </span>
                      <input
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Parcelamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantidade de parcelas
                    </label>
                    <select
                      name="installments"
                      value={formData.installments}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <option key={num} value={num}>{num}x</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Intervalo de parcelas
                    </label>
                    <select
                      name="installmentInterval"
                      value={formData.installmentInterval}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>
                </div>
                
                {/* Forma de pagamento */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Forma de pagamento
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiCreditCard />
                    </span>
                    <input
                      type="text"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Cartão de crédito, Boleto, PIX..."
                    />
                  </div>
                </div>
                
                {/* Botão Gerar Parcelas */}
                <button
                  type="button"
                  onClick={generateInstallments}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FiPlusCircle className="mr-2" />
                  Gerar Parcelas
                </button>
                
                {/* Parcelas Geradas */}
                {formData.generatedInstallments.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <h3 className="bg-gray-100 p-3 font-medium text-gray-700">Parcelas Geradas</h3>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Parcela</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.generatedInstallments.map((installment) => (
                            <tr key={installment.number} className="border-b hover:bg-gray-50">
                              <td className="p-3">{installment.number}/{formData.installments}</td>
                              <td className="p-3">{new Date(installment.date).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3 font-medium">
                                R$ {parseFloat(installment.value).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Botões de Ação */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Salvar Transação
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}