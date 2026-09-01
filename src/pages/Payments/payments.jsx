import { useContext, useEffect, useState } from 'react'
import {AuthContext} from '../../contexts/auth'

import Header from '../../components/Header'
import Title from '../../components/Title'
import { FiPlus, FiMessageSquare, FiSearch, FiEdit2, FiDollarSign } from 'react-icons/fi'

import { Link } from 'react-router-dom'
import { collection, getDocs, orderBy, limit, startAfter, query} from 'firebase/firestore'
import { db } from '../../services/firebaseConnection'

import { format } from 'date-fns'
import ModalPayments from '../../components/ModalPayments/modalPayments'

import './payments.css'

const listRef = collection(db, "payments")

export default function Payments(){
  const { logout } = useContext(AuthContext);

  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true);

  const [isEmpty, setIsEmpty] = useState(false)
  const [lastDocs, setLastDocs] = useState()
  const [loadingMore, setLoadingMore] = useState(false);

  const [showPostModal, setShowPostModal] = useState(false);
  const [detail, setDetail] = useState()


  useEffect(() => {
    async function loadProjetos(){
      const q = query(listRef, orderBy('created', 'desc'), limit(5));

      const querySnapshot = await getDocs(q)
      setProjetos([]);

      await updateState(querySnapshot)

      setLoading(false);

    }

    loadProjetos();


    return () => { }
  }, [])


  async function updateState(querySnapshot){
    const isCollectionEmpty = querySnapshot.size === 0;

    if(!isCollectionEmpty){
      let lista = [];

      querySnapshot.forEach((doc) => {
        lista.push({
          id: doc.id,
          assunto: doc.data().assunto,
          valor: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(doc.data().valor),
          cliente: doc.data().cliente,
          clienteId: doc.data().clienteId,
          created: doc.data().created,
          createdFormat: format(doc.data().created.toDate(), 'dd/MM/yyyy'),
          status: doc.data().status,
          complemento: doc.data().complemento,
        })
      })

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] // Pegando o ultimo item

      setProjetos(projetos => [...projetos, ...lista])
      setLastDocs(lastDoc);

    }else{
      setIsEmpty(true);
    }

    setLoadingMore(false);

  }


  async function handleMore(){
    setLoadingMore(true);

    const q = query(listRef, orderBy('created', 'desc'), startAfter(lastDocs),  limit(5));
    const querySnapshot = await getDocs(q);
    await updateState(querySnapshot);

  }


  function toggleModal(item){
    setShowPostModal(prev => !prev);
    setDetail(item);
  }


  if(loading){
    return(
      <div>
        <Header/>

        <div className="content">
          <Title name="Consultify">
            <FiMessageSquare size={25} />
          </Title>

          <div className="container payments">
            <span>Buscando projetos...</span>
          </div>
        </div>
      </div>
    )
  }

  return(
    <div>
      <Header/>

      <div className="content">
        <Title name="Pagamentos">
          <FiDollarSign size={25} />
        </Title>

        <>
          {projetos.length === 0 ? (
            <div className="container payments">
              <span>Nenhum pagamento encontrado...</span>
              <button className="new" onClick={() => toggleModal(true)} navigate>
                <FiPlus color="#FFF" size={25} />
                Novo Projeto
              </button>  
            </div>
          ) : (
            <>
              <button className="new" onClick={() => toggleModal(true)} navigate>
                <FiPlus color="#FFF" size={25} />
                Novo Projeto
              </button>  

              <table>
                <thead>
                  <tr>
                    <th scope="col">Cliente</th>
                    <th scope="col">Assunto</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Cadastrado em</th>
                    <th scope="col">Opções</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((item, index) => {
                    return(
                      <tr key={index}>
                        <td data-label="Cliente">{item.cliente}</td>
                        <td data-label="Assunto">{item.assunto}</td>
                        <td data-label="Valor">{item.valor}</td>
                        <td data-label="Status">
                          <span className="badge" style={{ backgroundColor: item.status === 'Aberto' ? '#5cb85c' : '#999' }}>
                            {item.status}
                          </span>
                        </td>
                        <td data-label="Cadastrado">{item.createdFormat}</td>
                        <td data-label="#">
                          <button className="action" style={{ backgroundColor: '#3583f6' }} onClick={ () => toggleModal(item)}>
                            <FiSearch color='#FFF' size={17}/>
                          </button>
                          <Link to={`/new/${item.id}`} className="action" style={{ backgroundColor: '#f6a935' }}>
                            <FiEdit2 color='#FFF' size={17}/>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>   


              {loadingMore && <h3>Buscando mais projetos...</h3>}    
              {!loadingMore && !isEmpty && <button className="btn-more" onClick={handleMore}>Buscar mais</button>  }  
            </>
          )}
        </>

      </div>

      {showPostModal && (
        <ModalPayments
          conteudo={detail}
          close={ () => setShowPostModal(false) }
        />
      )}
    
    </div>
  )
}