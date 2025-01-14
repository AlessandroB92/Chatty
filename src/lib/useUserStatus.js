import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase"; // Assicurati che i percorsi siano corretti
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const useUserStatus = () => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsOnline(true);
        // Imposta lo stato dell'utente su "online" in Firestore
        await updateDoc(doc(db, "users", user.uid), {
          status: "online",
          lastActive: serverTimestamp(),
        });
      } else {
        setUser(null);
        setIsOnline(false);
      }
    });

    // Quando l'utente esce o il componente si smonta, imposta lo stato su "offline"
    return () => {
      if (user) {
        updateDoc(doc(db, "users", user.uid), {
          status: "offline",
        });
      }
      unsubscribe();
    };
  }, [user]);

  return { user, isOnline };
};

export default useUserStatus;
