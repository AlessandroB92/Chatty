import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import "./addUser.css";
import { db } from "../../../../lib/firebase";
import { useEffect, useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ setAddMode }) => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useUserStore();

  useEffect(() => {
    // Funzione per recuperare tutti gli utenti
    const fetchUsers = async () => {
      try {
        const userRef = collection(db, "users");
        const querySnapshot = await getDocs(userRef);

        // Filtro per evitare di mostrare l'utente attualmente loggato
        const allUsers = querySnapshot.docs
          .filter((doc) => doc.id !== currentUser.id)
          .map((doc) => ({ id: doc.id, ...doc.data() }));

        setUsers(allUsers);
      } catch (err) {
        console.error("Errore nel recupero degli utenti:", err);
      }
    };

    fetchUsers();
  }, [currentUser.id]);

  const handleAdd = async (selectedUser) => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatRef, selectedUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: selectedUser.id,
          updatedAt: Date.now(),
        }),
      });

      setAddMode(false);
    } catch (err) {
      console.error("Errore durante l'aggiunta dell'utente:", err);
    }
  };

  return (
    <div className="addUser">
      <h2>Seleziona un utente</h2>
      <div className="users">
        {users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} className="user">
              <div className="detail">
                <img src={u.avatar || "./avatar.png"} alt="Avatar" />
                <span>{u.username}</span>
              </div>
              <button onClick={() => handleAdd(u)}>Aggiungi</button>
            </div>
          ))
        ) : (
          <p>Nessun utente trovato.</p>
        )}
      </div>
    </div>
  );
};

export default AddUser;
