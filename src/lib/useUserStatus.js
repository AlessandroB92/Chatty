import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, updateDoc, serverTimestamp, onSnapshot, collection } from "firebase/firestore";

const useUserStatus = () => {
  const [user, setUser] = useState(null);
  const [usersStatus, setUsersStatus] = useState({});  // Stato per memorizzare lo stato online di tutti gli utenti

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Imposta l'utente come online su Firestore
        await updateDoc(doc(db, "users", user.uid), {
          status: "online",
          lastActive: serverTimestamp(),
        });

        // Listener per aggiornamenti in tempo reale sullo stato online di tutti gli utenti
        const unsubscribeStatus = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            let usersStatus = {};
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              usersStatus[doc.id] = data.status; // Salva lo stato online di ogni utente
            });
            setUsersStatus(usersStatus); // Aggiorna lo stato in tempo reale
          }
        );

        return () => {
          unsubscribeStatus();
        };
      } else {
        setUser(null);
        setUsersStatus({}); // Reset dello stato online
      }
    });

    return () => {
      if (user) {
        // Imposta l'utente come offline su Firestore quando si disconnette
        updateDoc(doc(db, "users", user.uid), {
          status: "offline",
        });
      }
      unsubscribeAuth();
    };
  }, [user]);

  return { user, usersStatus }; // Restituisci lo stato di tutti gli utenti
};

export default useUserStatus;
