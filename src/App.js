import React, { useEffect, useRef, useState } from 'react'
import "./app.css"

import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { app } from "./firebase"

import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'

import { Box, Button, Container, HStack, Input, VStack } from '@chakra-ui/react'
import Message from './components/Message'


const auth = getAuth(app);

const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
}

const logoutHandler = () => signOut(auth)


const App = () => {

  const [user, setUser] = useState(false)

  const [message, setMessage] = useState('')

  const [messages, setMessages] = useState([])

  const divForscroll = useRef(null)


  const submitHandler = async (e) => {
    e.preventDefault()

    setMessage("");
    try {
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      })
      divForscroll.current.scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
      alert(error)
    }
  }

  useEffect(() => {

    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"))

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data)
    });

    const unsubscribeForMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      )
    })

    return () => {
      unsubscribe()
      unsubscribeForMessage()
    }
  }, [])


  return (
    <Box bg={"red.100"}>
      {
        user ? (<Container h={"100vh"} bg={"white"}>
          <VStack h={"full"} paddingY={"4"} >
            <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>Logout</Button>
            <VStack w={"full"} h={"full"} overflowY={"auto"}>
              {
                messages.map(item => (
                  <Message key={item.id} user={item.uid === user.uid ? "me" : "other"} text={item.text} uri={item.uri} />
                ))
              }
              <div ref={divForscroll}></div>
            </VStack>
            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input value={message} onChange={(e) => { setMessage(e.target.value) }} placeholder='Enter a message' />
                <Button colorScheme={"blue"} type='submit'>Send</Button>
              </HStack>
            </form>
          </VStack>
        </Container>) : <VStack h={"100vh"} justifyContent={"center"}>
          <Button onClick={loginHandler}>sign in with google</Button>
        </VStack>
      }
    </Box>
  )
}

export default App
