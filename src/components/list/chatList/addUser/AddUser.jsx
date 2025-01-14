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
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ setAddMode }) => {
  const [users, setUsers] = useState([]);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username").toLowerCase();

    try {
      const userRef = collection(db, "users");

      const querySnapshot = await getDocs(userRef);

      const foundUsers = querySnapshot.docs.filter((doc) =>
        doc.data().username.toLowerCase().includes(username)
      );

      if (foundUsers.length > 0) {
        setUsers(foundUsers.map((doc) => ({ id: doc.id, ...doc.data() })));
      } else {
        console.log("No users found");
        setUsers([]);
      }
    } catch (err) {
      console.log(err);
    }
  };

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

      console.log("Chat creata con ID:", newChatRef.id);

      setAddMode(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Cerca</button>
      </form>
      {users.length > 0 && (
        <div className="users">
          {users.map((u) => (
            <div key={u.id} className="user">
              <div className="detail">
                <img src={u.avatar || "./avatar.png"} alt="" />
                <span>{u.username}</span>
              </div>
              <button onClick={() => handleAdd(u)}>Add User</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddUser;
