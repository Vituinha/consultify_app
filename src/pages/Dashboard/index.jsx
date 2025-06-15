import { useContext, useEffect, useState } from 'react'
import {AuthContext} from '../../contexts/auth'

import Header from '../../components/Header'
import Title from '../../components/Title'
import { FiPlus, FiSearch, FiEdit2 } from 'react-icons/fi'

import { Link } from 'react-router-dom'
import { collection, getDocs, orderBy, limit, startAfter, query} from 'firebase/firestore'
import { db } from '../../services/firebaseConnection'

import { format } from 'date-fns'
import Modal from '../../components/Modal'

import './dashboard.css'

const listRef = collection(db, "projetos")

export default function Dashboard(){
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
    setShowPostModal(!showPostModal)
    setDetail(item)
  }


  if(loading){
    return(
      <div>
        <Header/>

        <div className="content">
          <Title name="Consultify">
          </Title>

          <div className="container dashboard">
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
        <h1>Projetos</h1>
        <p className='subtitle'>Gerencie todos os seus projetos em um só lugar.</p>

        <>
          {projetos.length === 0 ? (
            <div className="container dashboard">
              <span>Nenhum projeto encontrado...</span>
              <Link to="/new" className="new" style={{ backgroundColor: '#181c2e', borderRadius: '8px', padding: '15px' }}>
                <FiPlus color="#FFF" size={25} />
                Novo Projeto
              </Link>  
            </div>
          ) : (
            <div className='mainTable'>
              <Link to="/new" className="new" style={{ backgroundColor: '#181c2e', borderRadius: '8px', padding: '15px' }}>
                <FiPlus color="#FFF" size={18} />
                Novo Projeto
              </Link>  

              <table className="mainTable">
                <thead>
                  <tr>
                    <th scope="col" style={{ borderLeft: '1px solid #686868' }}>Cliente</th>
                    <th scope="col">Assunto</th>
                    <th scope="col">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Cadastrado em</th>
                    <th scope="col" style={{ borderRight: '1px solid #686868' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((item, index) => {
                    return(
                      <tr key={index}>
                        <td data-label="Cliente" style={{ borderLeft: '1px solid #686868' }}>{item.cliente}</td>
                        <td data-label="Assunto">{item.assunto}</td>
                        <td data-label="Valor">{item.valor}</td>
                        <td data-label="Status">
                          <span className="badge" style={{ backgroundColor: item.status === 'Aberto' ? '#d6f5bd' : '#f1d5ab', fontSize: '14px', fontWeight: 'bolder',
                             padding: '8px', borderRadius: '20px',
                             border: item.status === 'Aberto' ? '2px solid rgb(115, 255, 0)' : '2px solid rgb(246, 169, 53)',
                             color: item.status === 'Aberto' ? '#0ab613' : '#c57804' }}>
                            {item.status}
                          </span>
                        </td>
                        <td data-label="Cadastrado">{item.createdFormat}</td>
                        <td data-label="#" style={{ borderRight: '1px solid #686868' }}>
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
            </div>
          )}
        </>

      </div>

      {showPostModal && (
        <Modal
          conteudo={detail}
          close={ () => setShowPostModal(!showPostModal) }
        />
      )}
    
    </div>
  )
}