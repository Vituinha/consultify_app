
import { useState, useEffect, useContext  } from 'react'
import Header from '../../components/Header'
import Title from '../../components/Title'
import { FiPlusCircle} from 'react-icons/fi'

import {AuthContext} from '../../contexts/auth'
import { db } from '../../services/firebaseConnection'
import {collection, getDocs, getDoc, doc, addDoc, updateDoc} from 'firebase/firestore'

import { useParams, useNavigate } from 'react-router-dom'

import { toast } from 'react-toastify'

import './new.css';

const listRef = collection(db, "customers");

export default function New(){
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([])
  const [loadCustomer, setLoadCustomer] = useState(true);
  const [customerSelected, setCustomerSelected] = useState(0)

  const [complemento, setComplemento] = useState('')
  const [assunto, setAssunto] = useState('Consultoria')
  const [valor, setValor] = useState(0)
  const [status, setStatus] = useState('Aberto')
  const [idCustomer, setIdCustomer] = useState(false)
  

  useEffect(() => {
    async function loadCustomers(){
      const querySnapshot = await getDocs(listRef)
      .then( (snapshot) => {
        let lista = [];

        snapshot.forEach((doc) => {
          lista.push({
            id: doc.id,
            nomeFantasia: doc.data().nomeFantasia
          })
        })

        if(snapshot.docs.size === 0){
          console.log("NENHUMA EMPRESA ENCONTRADA");
          setCustomers([ { id: '1', nomeFantasia: 'FREELA' } ])
          setLoadCustomer(false);
          return;
        }

        setCustomers(lista);
        setLoadCustomer(false);

        if(id){
          loadId(lista);
        }

      })
      .catch((error) => {
        console.log("ERRRO AO BUSCAR OS CLIENTES", error)
        setLoadCustomer(false);
        setCustomers([ { id: '1', nomeFantasia: 'FREELA' } ])
      })
    }

    loadCustomers();    
  }, [id])


  async function loadId(lista){
    const docRef = doc(db, "projetos", id);
    await getDoc(docRef)
    .then((snapshot) => {
      setAssunto(snapshot.data().assunto)
      setValor(snapshot.data().valor)
      setStatus(snapshot.data().status)
      setComplemento(snapshot.data().complemento);


      let index = lista.findIndex(item => item.id === snapshot.data().clienteId)
      setCustomerSelected(index);
      setIdCustomer(true);

    })
    .catch((error) => {
      console.log(error);
      setIdCustomer(false);
    })
  }


  function handleOptionChange(e){
    setStatus(e.target.value);
  }

  function handleChangeSelect(e){
    setAssunto(e.target.value)
  }

  function handleChangeValue(e){
    setValor(e.target.value)
  }

  function hnadleChangeCustomer(e){
    setCustomerSelected(e.target.value)
    console.log(customers[e.target.value].nomeFantasia);
  }

  async function handleRegister(e){
    e.preventDefault();

    if(idCustomer){
      //Atualizando projetos
      const docRef = doc(db, "projetos", id)
      await updateDoc(docRef, {
        cliente: customers[customerSelected].nomeFantasia,
        clienteId: customers[customerSelected].id,
        assunto: assunto,
        valor: valor,
        complemento: complemento,
        status: status,
        userId: user.uid,
      })
      .then(() => {
        toast.info("Projeto atualizado com sucesso!")
        setCustomerSelected(0);
        setComplemento('');
        navigate('/dashboard')
      })
      .catch((error) => {
        toast.error("Ops erro ao atualizar esse projeto!")
        console.log(error);
      })

      return;
    }


    //Registrar um projeto
    await addDoc(collection(db, "projetos"), {
      created: new Date(),
      cliente: customers[customerSelected].nomeFantasia,
      clienteId: customers[customerSelected].id,
      assunto: assunto,
      valor: valor,
      complemento: complemento,
      status: status,
      userId: user.uid,
    })
    .then(() => {
      toast.success("Projeto registrado!")
      setComplemento('')
      setCustomerSelected(0)
    })
    .catch((error) => {
      toast.error("Ops erro ao registrar, tente mais tarde!")
      console.log(error);
    })
  }

  return(
    <div>
      <Header/>

      <div className="content">
        <Title name={id ? "Editando Projeto" : "Novo Projeto"}>
          <FiPlusCircle size={25}/>
        </Title>

        <div className="container">
          <form className="form-profile" onSubmit={handleRegister}>

            <label>Clientes</label>
            {
              loadCustomer ? (
                <input type="text" disabled={true} value="Carregando..." />
              ) : (
                <select value={customerSelected} onChange={hnadleChangeCustomer}>
                  {customers.map((item, index) => {
                    return(
                      <option key={index} value={index}>
                        {item.nomeFantasia}
                      </option>
                    )
                  })}
                </select>
              )
            }

            <label>Assunto</label>
            <select value={assunto} onChange={handleChangeSelect}>
              <option value="Consultoria">Consultoria</option>
              <option value="Projeto">Projeto</option>
              <option value="Outros">Outros</option>
            </select>

            <label>Valor</label>
            <input
                type="text"
                name="valor"
                value={valor}
                onChange={handleChangeValue}
              />

            <label>Status</label>
            <div className="status">
              <input
                type="radio"
                name="radio"
                value="Aberto"
                onChange={handleOptionChange}
                checked={ status === 'Aberto' }
              />
              <span>Em aberto</span>

              <input
                type="radio"
                name="radio"
                value="Progresso"
                onChange={handleOptionChange}
                checked={ status === 'Progresso' }
              />
              <span>Progresso</span>

              <input
                type="radio"
                name="radio"
                value="Atendido"
                onChange={handleOptionChange}
                checked={ status === 'Atendido' }
              />
              <span>Atendido</span>
            </div>


            <label>Complemento</label>
            <textarea
              type="text"
              placeholder="Descreva seu problema (opcional)."
              value={complemento}
              onChange={ (e) => setComplemento(e.target.value) }
            />

            <button type="submit">Registrar</button>

          </form>
        </div>
      </div>
    </div>
  )
}