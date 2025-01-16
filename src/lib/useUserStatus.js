import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, updateDoc, serverTimestamp, onSnapshot, collection } from "firebase/firestore";
import { toast } from 'react-toastify';  // Importa il toast

const useUserStatus = () => {
  const [user, setUser] = useState(null);
  const [usersStatus, setUsersStatus] = useState({});  // Stato per memorizzare lo stato online di tutti gli utenti
  const [lastActive, setLastActive] = useState(Date.now()); // Memorizza l'ultimo momento di attività

  // Funzione per mostrare il toast di disconnessione
  const showLogoutToast = () => {
    toast.info("Sei stato disconnesso per inattività", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  useEffect(() => {
    const handleActivity = () => {
      setLastActive(Date.now()); // Reset del timer ogni volta che c'è attività
    };

    // Aggiungi listener per attività (mousemove, click, etc.)
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    const timeoutDuration = 8 * 60 * 60 * 1000; // 5 secondi di inattività per il logout
    const inactivityTimeout = setTimeout(async () => {
      if (Date.now() - lastActive >= timeoutDuration) {
        if (user) {
          // Mostra il toast prima del logout
          showLogoutToast();

          // Ritardo di 2 secondi per lasciare che il toast venga visualizzato prima di disconnettere
          setTimeout(async () => {
            // Esegui logout quando l'utente è inattivo per troppo tempo
            await updateDoc(doc(db, "users", user.uid), {
              status: "offline",  // Imposta l'utente come offline su Firestore
            });
            // Disconnetti l'utente
            auth.signOut();
          }, 3000); // Ritardo di 3 secondi
        }
      }
    }, timeoutDuration);

    // Rimuovi gli event listener al termine dell'effetto
    return () => {
      clearTimeout(inactivityTimeout);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [lastActive, user]); // Aggiorna quando c'è attività o l'utente cambia

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Imposta l'utente come online su Firestore e aggiorna l'ultimo accesso
        await updateDoc(doc(db, "users", user.uid), {
          status: "online",
          lastActive: serverTimestamp(),
          lastAccess: serverTimestamp(),  // Salva l'ultimo accesso
        });

        // Listener per aggiornamenti in tempo reale sullo stato online di tutti gli utenti
        const unsubscribeStatus = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            let usersStatus = {};
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              usersStatus[doc.id] = data;  // Salva lo stato e l'ultimo accesso di ogni utente
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
